# Password Manager - SecureVault

## Project Overview

- **Project name:** SecureVault - Password Manager
- **Type:** Web Application (Full-stack)
- **Goal:** Build a password manager with Zero-Knowledge architecture - client-side encryption, server stores only encrypted data
- **Course:** Information Security for Web Applications

---

## Architecture: Zero-Knowledge

```
┌─────────────┐     HTTPS      ┌─────────────┐     DB       ┌─────────────┐
│   Browser   │ ◄─────────────►│   Server    │◄────────────►│  Database   │
│  (Client)   │                │  (Express)  │              │  (SQLite)   │
├─────────────┤                ├─────────────┤              ├─────────────┤
│ - Derive    │                │ - Store     │              │ - users     │
│   Key (PBKDF2)               │   encrypted │              │ - salt      │
│ - Encrypt   │                │   data      │              │ - ciphertext│
│ - Decrypt   │                │ - Auth      │              │             │
│ - Generate  │                │   (bcrypt)  │              │             │
│   Password  │                │             │              │             │
└─────────────┘                └─────────────┘              └─────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | SQLite |
| Encryption (Client) | Web Crypto API |
| Auth (Server) | bcrypt + JWT |

---

## Features

### 1. Authentication
- Register with Master Password
- Login with Master Password
- Logout (clear key from memory)
- JWT token-based session

### 2. Password Management
- Add new credentials (website, username, password)
- View credentials list (encrypted)
- View credential details (decrypt on demand)
- Edit credentials
- Delete credentials
- Copy to clipboard (auto-clear after 30s)

### 3. Password Generator
- Configurable length (8-64 chars)
- Options: uppercase, lowercase, numbers, special chars
- Uses CSPRNG (Cryptographically Secure PRNG)

### 4. Security
- Auto-lock after inactivity
- No Master Password stored anywhere
- Clipboard auto-clear
- Server never sees plaintext passwords

---

## Encryption Flow

### Registration
1. User enters Master Password
2. Generate random salt (16 bytes)
3. PBKDF2(MasterPassword, salt, 100000 iterations) → derivedKey
4. Store salt in DB (NOT password)
5. Store bcrypt(derivedKey) for login verification
6. Keep derivedKey in session memory

### Add Credential
1. User enters (website, username, password)
2. Generate random IV (12 bytes for GCM)
3. AES-256-GCM(plaintext, derivedKey, IV) → ciphertext
4. Send {website, username, ciphertext, IV} to server

### View Credential
1. Server returns ciphertext + IV
2. Client decrypts with derivedKey + IV
3. Display plaintext

---

## Database Schema

### users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### credentials
```sql
CREATE TABLE credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  website TEXT NOT NULL,
  username TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login, returns JWT |
| GET | /api/credentials | List all credentials |
| POST | /api/credentials | Add new credential |
| PUT | /api/credentials/:id | Update credential |
| DELETE | /api/credentials/:id | Delete credential |

---

## Directory Structure

```
/project-root
├── /client                 # React frontend
│   ├── /src
│   │   ├── /components     # UI components
│   │   ├── /hooks         # useAuth, useCrypto
│   │   ├── /pages         # Login, Register, Dashboard
│   │   ├── /utils         # crypto.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
│
├── /server                 # Express backend
│   ├── /src
│   │   ├── /routes        # auth.js, credentials.js
│   │   ├── /controllers   # authController.js, credentialsController.js
│   │   ├── /models        # database.js
│   │   ├── /middleware    # auth.js
│   │   └── index.js
│   ├── package.json
│   └── .env
│
└── package.json            # Root package.json
```

---

## Implementation Steps

### Step 1: Backend Foundation
- Initialize Node.js project
- Install: express, sqlite3, bcrypt, jsonwebtoken, cors
- Create database schema
- Implement auth routes

### Step 2: Frontend Foundation
- Initialize React + Vite project
- Create basic UI (Login, Register, Dashboard)
- Connect to API

### Step 3: Client-side Encryption
- Implement PBKDF2 key derivation (Web Crypto API)
- Implement AES-256-GCM encrypt/decrypt
- Implement password generator (CSPRNG)

### Step 4: Integration
- Connect UI with crypto functions
- CRUD operations for credentials
- Clipboard operations

### Step 5: Security Enhancements
- Auto-lock timeout
- Clipboard auto-clear
- Session management

---

## Security Notes

- NEVER send Master Password to server
- Use HTTPS in production
- PBKDF2 iterations: 100,000
- AES-GCM with 256-bit key
- Unique IV for each encryption

---

## Testing

1. Register → Check salt stored, password NOT stored
2. Add credential → Check DB has only ciphertext
3. Login again → Decrypt successfully
4. Password generator → Different passwords each time

### Security Verification
1. Open database directly → Cannot read plaintext
2. Check JS source → No master password
3. Test auto-lock after timeout
