
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignupForm from './component/SignupForm';
import LoginForm from './component/LoginForm';
import Dashboard from './component/RiderDashboard';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignupForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/component/RiderDashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
};

export default App;

