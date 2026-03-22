import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deriveKey, hashKey } from '../utils/crypto';
import './Auth.css';

const API_BASE = '/api';

export function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password) {
      setError('Please enter username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Get salt from server
      const saltResponse = await fetch(`${API_BASE}/auth/get-salt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() })
      });

      // If user not found, show generic error
      if (!saltResponse.ok) {
        setError('Invalid username or password');
        setLoading(false);
        return;
      }

      const saltData = await saltResponse.json();

      // Step 2: Derive key and hash it
      const key = await deriveKey(password, saltData.salt);
      const keyHash = await hashKey(key);

      // Step 3: Login with hashed key
      const result = await onLogin(username.trim(), keyHash, saltData.salt, key);

      if (result.success) {
        setPassword('');
        navigate('/dashboard');
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card slide-up">
        <div className="auth-header">
          <h1>SecureVault</h1>
          <p>Welcome back! Please login to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="label">Username</label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="Enter your username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="label">Master Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your master password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
