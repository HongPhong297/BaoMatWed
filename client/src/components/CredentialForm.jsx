import { useState, useEffect } from 'react';
import './CredentialForm.css';

export function CredentialForm({ onSubmit, onCancel, initialData, isEditing, onGeneratePassword }) {
  const [website, setWebsite] = useState(initialData?.website || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setWebsite(initialData.website || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!website || !username || !password) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        website,
        username,
        password
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUsePassword = (generatedPassword) => {
    setPassword(generatedPassword);
  };

  return (
    <div className="credential-form-overlay">
      <div className="credential-form-container slide-up">
        <h2>{isEditing ? 'Edit Credential' : 'Add New Credential'}</h2>

        {onGeneratePassword && (
          <div className="form-generator">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onGeneratePassword(handleUsePassword)}
            >
              Generate Password
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="credential-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label className="label">Website</label>
            <input
              type="text"
              className="input"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              required
              placeholder="e.g., google.com"
            />
          </div>

          <div className="form-group">
            <label className="label">Username / Email</label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="e.g., john@example.com"
            />
          </div>

          <div className="form-group">
            <label className="label">Password</label>
            <div className="password-input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
              />
              <button
                type="button"
                className="btn btn-secondary toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="form-actions">
            {onCancel && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
              >
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}