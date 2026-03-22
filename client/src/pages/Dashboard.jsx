import { useState, useEffect, useCallback } from 'react';
import { CredentialList } from '../components/CredentialList';
import { CredentialForm } from '../components/CredentialForm';
import { PasswordGenerator } from '../components/PasswordGenerator';
import './Dashboard.css';

const API_BASE = '/api';
const AUTO_LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function Dashboard({ user, token, getAuthHeader, onLogout, crypto }) {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCredential, setEditingCredential] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [decryptedPasswords, setDecryptedPasswords] = useState({});
  const [showGeneratorInForm, setShowGeneratorInForm] = useState(false);
  const [passwordGeneratorCallback, setPasswordGeneratorCallback] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Track user activity for auto-lock
  useEffect(() => {
    const updateActivity = () => setLastActivity(Date.now());

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
    };
  }, []);

  // Auto-lock after inactivity
  useEffect(() => {
    const checkLock = () => {
      if (Date.now() - lastActivity > AUTO_LOCK_TIMEOUT) {
        handleLogout();
      }
    };

    const interval = setInterval(checkLock, 30000);
    return () => clearInterval(interval);
  }, [lastActivity]);

  // Fetch credentials
  const fetchCredentials = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/credentials`, {
        headers: {
          ...getAuthHeader()
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleLogout();
          return;
        }
        throw new Error('Failed to fetch credentials');
      }

      const data = await response.json();
      setCredentials(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  // Store username globally for modal to access
  useEffect(() => {
    window.__currentUsername__ = user?.username;
    return () => {
      delete window.__currentUsername__;
    };
  }, [user]);

  const handleAddClick = () => {
    setShowForm(true);
  };

  const handleEditClick = (cred) => {
    setEditingCredential({
      id: cred.id,
      website: cred.website,
      username: cred.username,
      password: decryptedPasswords[cred.id] || ''
    });
    setShowForm(true);
  };

  const handleDeleteClick = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/credentials/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete credential');
      }

      setDecryptedPasswords((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });

      await fetchCredentials();
    } catch (err) {
      setError(err.message);
    }
  };

  const doAddCredential = async () => {
    // Get data from form (need to refactor to store form data)
    const formData = window.__pendingFormData__;
    if (!formData) return;

    const { encryptedPassword, iv } = await crypto.encryptPassword(formData.password);

    const response = await fetch(`${API_BASE}/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        website: formData.website,
        username: formData.username,
        encryptedPassword,
        iv
      })
    });

    delete window.__pendingFormData__;

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to add credential');
    }

    setShowForm(false);
    setShowGeneratorInForm(false);
    await fetchCredentials();
  };

  const doEditCredential = async () => {
    const formData = window.__pendingFormData__;
    if (!formData) return;

    const { encryptedPassword, iv } = await crypto.encryptPassword(formData.password);

    const response = await fetch(`${API_BASE}/credentials/${editingCredential.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        website: formData.website,
        username: formData.username,
        encryptedPassword,
        iv
      })
    });

    delete window.__pendingFormData__;

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update credential');
    }

    setEditingCredential(null);
    setShowForm(false);
    setShowGeneratorInForm(false);
    setDecryptedPasswords((prev) => {
      const newState = { ...prev };
      delete newState[editingCredential.id];
      return newState;
    });
    await fetchCredentials();
  };

  const handleAddCredential = async (data) => {
    window.__pendingFormData__ = data;
    try {
      await doAddCredential();
    } catch (err) {
      setError(err.message);
    }
    setShowForm(false);
    setShowGeneratorInForm(false);
  };

  const handleEditCredential = async (data) => {
    window.__pendingFormData__ = data;
    try {
      await doEditCredential();
    } catch (err) {
      setError(err.message);
    }
    setShowForm(false);
    setShowGeneratorInForm(false);
  };

  const handleViewPassword = async (id) => {
    const cred = credentials.find((c) => c.id === id);
    if (!cred) return;

    // If already decrypted, hide it
    if (decryptedPasswords[id]) {
      setDecryptedPasswords((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      return;
    }

    // Decrypt the password
    try {
      const decrypted = await crypto.decryptPassword(
        cred.encryptedPassword,
        cred.iv
      );
      setDecryptedPasswords((prev) => ({
        ...prev,
        [id]: decrypted
      }));
    } catch (err) {
      setError('Failed to decrypt password');
    }
  };

  const handleEdit = (cred) => {
    handleEditClick(cred);
  };

  const handleLogout = () => {
    crypto.clearKey();
    onLogout();
  };

  const handleGeneratePassword = (callback) => {
    setShowGeneratorInForm(true);
    setShowGenerator(true);
    setPasswordGeneratorCallback(() => callback);
  };

  const handleUseGeneratedPassword = (password) => {
    if (passwordGeneratorCallback) {
      passwordGeneratorCallback(password);
      setPasswordGeneratorCallback(null);
    }
    setShowGenerator(false);
    setShowGeneratorInForm(false);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>SecureVault</h1>
          <span className="user-greeting">Welcome, {user.username}</span>
        </div>
        <div className="header-right">
          <button
            className="btn btn-secondary"
            onClick={() => setShowGenerator(!showGenerator)}
          >
            {showGenerator ? 'Hide Generator' : 'Generator'}
          </button>
          <button className="btn btn-primary" onClick={handleAddClick}>
            + Add Credential
          </button>
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {error && (
        <div className="dashboard-error">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <main className="dashboard-content">
        {showGenerator && (
          <div className="generator-section">
            <PasswordGenerator
              onGenerate={crypto.generatePassword}
              onUsePassword={showGeneratorInForm ? handleUseGeneratedPassword : null}
            />
          </div>
        )}

        <div className="credentials-section">
          {loading ? (
            <div className="loading">Loading credentials...</div>
          ) : (
            <CredentialList
              credentials={credentials}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onViewPassword={handleViewPassword}
              decryptedPasswords={decryptedPasswords}
            />
          )}
        </div>
      </main>

      {showForm && (
        <CredentialForm
          onSubmit={editingCredential ? handleEditCredential : handleAddCredential}
          onCancel={() => {
            setShowForm(false);
            setEditingCredential(null);
            setShowGeneratorInForm(false);
            delete window.__pendingFormData__;
          }}
          initialData={editingCredential}
          isEditing={!!editingCredential}
          onGeneratePassword={showGeneratorInForm ? null : handleGeneratePassword}
        />
      )}

      <footer className="dashboard-footer">
        <p>
          Auto-lock after 5 minutes of inactivity • Clipboard auto-clears after 30 seconds
        </p>
      </footer>
    </div>
  );
}
