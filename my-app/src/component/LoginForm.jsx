import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get('https://6795e823bedc5d43a6c3bacc.mockapi.io/riderDetails');
      const rider = response.data.find(rider => rider.email === email && rider.password === password);
      
      if (rider) {
        // Update rider status to online in the API
        const updatedRider = { ...rider, status: 'online' };
        await axios.put(`https://6795e823bedc5d43a6c3bacc.mockapi.io/riderDetails/${rider.id}`, updatedRider);

        // Store rider status as online in localStorage
        localStorage.setItem('riderStatus', JSON.stringify({ email: rider.email, status: 'online' }));

        navigate('/component/RiderDashboard'); // Redirect to dashboard after successful login
      } else {
        setError('Invalid email or password.');
      }
    } catch (error) {
      setError('Error during login. Please try again.');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default LoginForm;
