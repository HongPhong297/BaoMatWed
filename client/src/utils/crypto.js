// Web Crypto API utilities for Zero-Knowledge encryption
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 32; // 256 bits for AES-256
const SALT_LENGTH = 16; // 128 bits
const IV_LENGTH = 12; // 96 bits for GCM

// Convert string to ArrayBuffer
function stringToBuffer(str) {
  return new TextEncoder().encode(str);
}

// Convert ArrayBuffer to string
function bufferToString(buffer) {
  return new TextDecoder().decode(buffer);
}

// Convert ArrayBuffer to Base64
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to ArrayBuffer
function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate random bytes using CSPRNG
export function generateRandomBytes(length) {
  return crypto.getRandomValues(new Uint8Array(length));
}

// Generate a random salt
export function generateSalt() {
  const salt = generateRandomBytes(SALT_LENGTH);
  return bufferToBase64(salt);
}

// Generate a random IV for AES-GCM
export function generateIV() {
  const iv = generateRandomBytes(IV_LENGTH);
  return bufferToBase64(iv);
}

// Derive key from master password using PBKDF2
export async function deriveKey(masterPassword, saltBase64) {
  const salt = base64ToBuffer(saltBase64);
  const passwordBuffer = stringToBuffer(masterPassword);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );

  return key;
}

// Export key to raw format for storage/comparison
export async function exportKey(key) {
  const exported = await crypto.subtle.exportKey('raw', key);
  return bufferToBase64(exported);
}

// Encrypt data using AES-256-GCM
export async function encrypt(plaintext, key, ivBase64) {
  const iv = base64ToBuffer(ivBase64);
  const plaintextBuffer = stringToBuffer(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    plaintextBuffer
  );

  return bufferToBase64(ciphertext);
}

// Decrypt data using AES-256-GCM
export async function decrypt(ciphertextBase64, key, ivBase64) {
  const iv = base64ToBuffer(ivBase64);
  const ciphertext = base64ToBuffer(ciphertextBase64);

  const plaintextBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    ciphertext
  );

  return bufferToString(plaintextBuffer);
}

// Password generator using CSPRNG
export function generatePassword(options = {}) {
  const {
    length = 16,
    uppercase = true,
    lowercase = true,
    numbers = true,
    special = true
  } = options;

  let charset = '';
  if (uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) charset += '0123456789';
  if (special) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (charset.length === 0) {
    charset = 'abcdefghijklmnopqrstuvwxyz';
  }

  const randomBytes = generateRandomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
}

// Hash the derived key for server storage (using SHA-256)
export async function hashKey(derivedKey) {
  const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', exportedKey);
  return bufferToBase64(hashBuffer);
}
