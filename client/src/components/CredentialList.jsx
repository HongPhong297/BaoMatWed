import { useState } from 'react';
import './CredentialList.css';

export function CredentialList({
  credentials,
  onEdit,
  onDelete,
  onViewPassword,
  decryptedPasswords
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCredentials = credentials.filter((cred) =>
    cred.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cred.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      // Auto-clear clipboard after 30 seconds
      setTimeout(async () => {
        const currentClipboard = await navigator.clipboard.readText();
        if (currentClipboard === text) {
          await navigator.clipboard.writeText('');
        }
      }, 30000);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  };

  const handleCopyUsername = async (username) => {
    await copyToClipboard(username, 'Username');
  };

  const handleCopyPassword = async (password, id) => {
    const success = await copyToClipboard(password, 'Password');
    if (success) {
      onViewPassword(id);
    }
  };

  if (credentials.length === 0) {
    return (
      <div className="credential-list-empty">
        <div className="empty-icon">🔐</div>
        <h3>No credentials yet</h3>
        <p>Add your first credential to get started</p>
      </div>
    );
  }

  return (
    <div className="credential-list">
      <div className="list-header">
        <input
          type="text"
          className="input search-input"
          placeholder="Search credentials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className="credential-count">
          {filteredCredentials.length} item{filteredCredentials.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="credential-grid">
        {filteredCredentials.map((cred) => (
          <div key={cred.id} className="credential-card slide-up">
            <div className="card-header">
              <div className="website favicon">
                {cred.website.charAt(0).toUpperCase()}
              </div>
              <div className="card-info">
                <h4 className="website-name">{cred.website}</h4>
                <p className="username">{cred.username}</p>
              </div>
              <div className="card-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCopyUsername(cred.username)}
                  title="Copy username"
                >
                  📋
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onEdit(cred)}
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => onDelete(cred.id)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="card-password">
              <div className="password-field">
                <span className="password-label">Password:</span>
                <span className="password-value">
                  {decryptedPasswords[cred.id] || '••••••••••••'}
                </span>
              </div>
              <div className="password-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCopyPassword(decryptedPasswords[cred.id] || '', cred.id)}
                  disabled={!decryptedPasswords[cred.id]}
                  title="Copy password"
                >
                  Copy
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onViewPassword(cred.id)}
                >
                  {decryptedPasswords[cred.id] ? 'Hide' : 'Reveal'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCredentials.length === 0 && searchTerm && (
        <div className="no-results">
          <p>No credentials match your search</p>
        </div>
      )}
    </div>
  );
}
