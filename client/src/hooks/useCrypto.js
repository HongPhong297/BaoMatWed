import { useState, useCallback, useRef, useEffect } from 'react';
import {
  deriveKey,
  generateSalt,
  generateIV,
  encrypt,
  decrypt,
  generatePassword as genPassword,
  hashKey
} from '../utils/crypto';

export function useCrypto() {
  const [derivedKey, setDerivedKey] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const keyRef = useRef(null);

  // Initialize key from master password
  const initializeKey = useCallback(async (masterPassword, salt) => {
    try {
      const key = await deriveKey(masterPassword, salt);
      keyRef.current = key;
      setDerivedKey(key);
      setIsReady(true);
      return key;
    } catch (err) {
      console.error('Failed to initialize crypto key:', err);
      throw err;
    }
  }, []);

  // Clear key from memory
  const clearKey = useCallback(() => {
    keyRef.current = null;
    setDerivedKey(null);
    setIsReady(false);
  }, []);

  // Initialize key from existing key (after login)
  const initializeKeyFromKey = useCallback(async (key) => {
    keyRef.current = key;
    setDerivedKey(key);
    setIsReady(true);
    return key;
  }, []);

  // Encrypt a password
  const encryptPassword = useCallback(async (password) => {
    if (!keyRef.current) {
      throw new Error('Crypto key not initialized');
    }
    const iv = generateIV();
    const encrypted = await encrypt(password, keyRef.current, iv);
    return { encryptedPassword: encrypted, iv };
  }, []);

  // Decrypt a password
  const decryptPassword = useCallback(async (encryptedPassword, iv) => {
    if (!keyRef.current) {
      throw new Error('Crypto key not initialized');
    }
    const decrypted = await decrypt(encryptedPassword, keyRef.current, iv);
    return decrypted;
  }, []);

  // Generate password
  const generatePassword = useCallback((options) => {
    return genPassword(options);
  }, []);

  // Generate salt for new user
  const createSalt = useCallback(() => {
    return generateSalt();
  }, []);

  // Get hashed key for server (NOT raw key - security fix)
  const getKeyHash = useCallback(async () => {
    if (!keyRef.current) {
      throw new Error('Crypto key not initialized');
    }
    return await hashKey(keyRef.current);
  }, []);

  // Auto-clear key on unmount
  useEffect(() => {
    return () => {
      clearKey();
    };
  }, [clearKey]);

  return {
    isReady,
    initializeKey,
    initializeKeyFromKey,
    clearKey,
    encryptPassword,
    decryptPassword,
    generatePassword,
    createSalt,
    getKeyHash
  };
}
