import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Reg from './Reg.jsx';
import Login from './login.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Reg />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
