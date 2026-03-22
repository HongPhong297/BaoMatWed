import { useState, useEffect } from 'react';
import { deriveKey, hashKey } from '../utils/crypto';
import './PasswordConfirmModal.css';

export function PasswordConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [salt, setSalt] = useState('');

  useEffect(() => {
    if (isOpen && !salt) {
      fetchSalt();
    }
  }, [isOpen]);

  const fetchSalt = async () => {
    try {
      const username = window.__currentUsername__;
      if (!username) {
        console.error('No username found');
        return;
      }
      
      const response = await fetch('/api/auth/get-salt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSalt(data.salt);
      } else {
        console.error('Failed to get salt:', await response.text());
      }
    } catch (err) {
      console.error('Failed to get salt:', err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const key = await deriveKey(password, salt);
      const keyHash = await hashKey(key);
      
      await onConfirm(keyHash);
      setPassword('');
    } catch (err) {
      setError('Invalid password');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setSalt('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title || 'Confirm Action'}</h3>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p>{message || 'Please enter your master password to confirm.'}</p>
            
            {error && <div className="modal-error">{error}</div>}
            
            <div className="form-group">
              <label className="label">Master Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your master password"
                autoFocus
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Confirming...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
