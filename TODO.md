# Navigation Fixes TODO

## Issues to Fix:
1. home.jsx buttons navigate to Product.jsx instead of Login.jsx when user is logged in
2. Product.jsx profile button doesn't navigate to userProfile.jsx properly

## Plan:

- [ ] **luxe/src/home.jsx** - Change all navigate("/login") to navigate("/login?force=true") so login page always shows regardless of auth state
- [ ] **luxe/src/userProfile.jsx** - Change navigate('/home') to navigate('/') since /home route doesn't exist
- [ ] **luxe/src/Product.jsx** - Verify profile navigation works correctly

## Implementation Steps:
1. Edit home.jsx - replace all navigate("/login") with navigate("/login?force=true")
2. Edit userProfile.jsx - fix navigate('/home') to navigate('/')
3. Test the navigation flow
