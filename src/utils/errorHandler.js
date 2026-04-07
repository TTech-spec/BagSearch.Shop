// Enhanced error handling with security considerations

export class SecureErrorHandler {
  static handleError(error, context = '') {
    // Log detailed error for debugging (only in development)
    if (import.meta.env.DEV) {
      console.error(`Error [${context}]:`, error);
    } else {
      // In production, log minimal info
      console.error(`Error [${context}]:`, error?.message || 'Unknown error');
    }
    
    // Return generic error to client
    const genericErrors = {
      'default': 'An error occurred. Please try again.',
      'auth': 'Authentication failed. Please log in again.',
      'permission': 'You do not have permission to perform this action.',
      'rate_limit': 'Too many requests. Please try again later.',
      'file_upload': 'File upload failed. Please check your file and try again.',
      'validation': 'Invalid input. Please check your data and try again.',
      'network': 'Network error. Please check your connection and try again.',
      'database': 'Database error. Please try again later.',
      'not_found': 'The requested resource was not found.',
      'server_error': 'Server error. Please try again later.'
    };
    
    const errorType = this.categorizeError(error);
    let message = genericErrors[errorType] || genericErrors.default;

    // Give a more actionable message for known auth/database signup failures.
    if (
      context === 'registration' &&
      typeof error?.message === 'string' &&
      error.message.toLowerCase().includes('database error saving new user')
    ) {
      message = 'Registration failed because the user profile could not be created in the database. Please fix the Supabase users-table trigger or schema, then try again.';
    }

    return {
      message,
      type: errorType,
      timestamp: new Date().toISOString(),
      ...(import.meta.env.DEV && { details: error?.message })
    };
  }
  
  static categorizeError(error) {
    const message = error?.message?.toLowerCase() || '';
    const code = error?.code?.toLowerCase() || '';
    
    // Authentication errors
    if (message.includes('auth') || 
        message.includes('unauthorized') || 
        message.includes('invalid_token') ||
        code.includes('auth')) {
      return 'auth';
    }
    
    // Permission errors
    if (message.includes('permission') || 
        message.includes('forbidden') ||
        message.includes('access_denied') ||
        code.includes('permission')) {
      return 'permission';
    }
    
    // Rate limiting errors
    if (message.includes('rate') || 
        message.includes('limit') ||
        message.includes('too_many_requests') ||
        code.includes('rate')) {
      return 'rate_limit';
    }
    
    // File upload errors
    if (message.includes('file') || 
        message.includes('upload') ||
        message.includes('invalid_file') ||
        code.includes('file')) {
      return 'file_upload';
    }
    
    // Validation errors
    if (message.includes('validation') || 
        message.includes('invalid') ||
        message.includes('required') ||
        code.includes('validation')) {
      return 'validation';
    }
    
    // Network errors
    if (message.includes('network') || 
        message.includes('fetch') ||
        message.includes('connection') ||
        code === 'NETWORK_ERROR') {
      return 'network';
    }
    
    // Database errors
    if (message.includes('database') || 
        message.includes('constraint') ||
        message.includes('duplicate') ||
        code.includes('database')) {
      return 'database';
    }
    
    // Not found errors
    if (message.includes('not found') || 
        message.includes('does_not_exist') ||
        code === 'PGRST116') {
      return 'not_found';
    }
    
    // Server errors
    if (message.includes('server') || 
        message.includes('internal') ||
        code >= 500) {
      return 'server_error';
    }
    
    return 'default';
  }
  
  static sanitizeErrorForClient(error) {
    const sanitized = {
      message: 'An error occurred. Please try again.',
      type: 'default',
      timestamp: new Date().toISOString()
    };
    
    // Only include details in development
    if (import.meta.env.DEV) {
      sanitized.details = error?.message;
      sanitized.stack = error?.stack;
    }
    
    return sanitized;
  }
  
  static createErrorResponse(error, context = '') {
    const secureError = this.handleError(error, context);
    return {
      success: false,
      error: secureError,
      timestamp: new Date().toISOString()
    };
  }
}

// React error boundary component
export const ErrorBoundary = ({ children, fallback }) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }
    
    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }
    
    componentDidCatch(error, errorInfo) {
      const secureError = SecureErrorHandler.handleError(error, 'react_boundary');
      console.error('React Error Boundary caught:', secureError, errorInfo);
      
      // Report to monitoring service in production
      if (!import.meta.env.DEV) {
        // Example: Send to your monitoring service
        // reportError(secureError, errorInfo);
      }
    }
    
    render() {
      if (this.state.hasError) {
        return fallback || React.createElement(
          'div',
          {
            style: {
              padding: '20px',
              textAlign: 'center',
              color: '#dc2626',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }
          },
          React.createElement('h2', null, 'Something went wrong'),
          React.createElement('p', null, 'Please refresh the page and try again.'),
          React.createElement(
            'button',
            {
              onClick: () => this.setState({ hasError: false, error: null }),
              style: {
                padding: '10px 20px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }
            },
            'Try Again'
          )
        );
      }
      
      return children;
    }
  };
};
