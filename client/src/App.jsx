import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { useAuth } from './hooks/useAuth';
import { useCrypto } from './hooks/useCrypto';
import { generateSalt, deriveKey, hashKey } from './utils/crypto';

function AuthWrapper() {
  const { user, token, loading, login, register, logout, getAuthHeader } = useAuth();
  const crypto = useCrypto();
  const [isCryptoReady, setIsCryptoReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      crypto.clearKey();
    };
  }, []);

  const handleLogin = async (username, keyHash, salt, key) => {
    try {
      const result = await login(username, keyHash);

      if (result.success) {
        await crypto.initializeKeyFromKey(key);
        setIsCryptoReady(true);
      }

      return result;
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const handleRegister = async (username, password) => {
    try {
      const newSalt = generateSalt();
      await crypto.initializeKey(password, newSalt);
      const keyHash = await crypto.getKeyHash();
      const result = await register(username, newSalt, keyHash);

      if (result.success) {
        // Auto-login after registration to get JWT token
        const key = await deriveKey(password, newSalt);
        const loginKeyHash = await hashKey(key);
        const loginResult = await login(username, loginKeyHash);
        if (loginResult.success) {
          await crypto.initializeKeyFromKey(key);
          setIsCryptoReady(true);
        }
      }

      return result;
    } catch (err) {
      console.error('Register error:', err);
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const handleLogout = () => {
    crypto.clearKey();
    setIsCryptoReady(false);
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (loading) return;
    if (token && user && !isCryptoReady) {
      navigate('/login');
    }
  }, [token, user, isCryptoReady, loading, navigate]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh'
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isCryptoReady && token ? <Navigate to="/dashboard" replace /> : (
            <Login onLogin={handleLogin} />
          )
        }
      />
      <Route
        path="/register"
        element={
          isCryptoReady && token ? <Navigate to="/dashboard" replace /> : (
            <Register onRegister={handleRegister} />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          !token || !isCryptoReady ? (
            <Navigate to="/login" replace />
          ) : (
            <Dashboard
              user={user}
              token={token}
              getAuthHeader={getAuthHeader}
              onLogout={handleLogout}
              crypto={crypto}
            />
          )
        }
      />
      <Route
        path="/"
        element={<Navigate to={token && isCryptoReady ? "/dashboard" : "/login"} replace />}
      />
      <Route
        path="*"
        element={<Navigate to={token && isCryptoReady ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthWrapper />
    </BrowserRouter>
  );
}