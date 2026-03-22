# SecureVault - Password Manager

A zero-knowledge password manager where the server never sees your plaintext passwords.

## Architecture

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

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | SQLite |
| Encryption | Web Crypto API (AES-256-GCM) |
| Auth | bcrypt + JWT |

## Features

- **Zero-Knowledge Architecture** - Master password never leaves the client
- **AES-256-GCM Encryption** - Client-side encryption for all credentials
- **PBKDF2 Key Derivation** - 100,000 iterations for key derivation
- **Password Generator** - Cryptographically secure random passwords
- **Auto-lock** - Session locks after inactivity
- **Clipboard Auto-clear** - Copied passwords cleared after 30s

## Getting Started

### Prerequisites

- Node.js >= 18
- npm

### Installation

```bash
# Install all dependencies
npm run install:all

# Start development servers
npm run dev
```

### Individual Setup

```bash
# Server
cd server
npm install
npm run dev

# Client
cd client
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login, returns JWT |
| GET | /api/credentials | List all credentials |
| POST | /api/credentials | Add new credential |
| PUT | /api/credentials/:id | Update credential |
| DELETE | /api/credentials/:id | Delete credential |

## Encryption Flow

### Registration
1. Generate random salt (16 bytes)
2. `PBKDF2(MasterPassword, salt, 100000 iterations)` → derivedKey
3. Store salt + `bcrypt(derivedKey)` in database
4. Keep derivedKey in session memory

### Add Credential
1. Generate random IV (12 bytes for GCM)
2. `AES-256-GCM(plaintext, derivedKey, IV)` → ciphertext
3. Send `{website, username, ciphertext, IV}` to server

### View Credential
1. Server returns ciphertext + IV
2. Client decrypts with derivedKey + IV
3. Display plaintext

## Project Structure

```
├── client/                # React frontend
│   └── src/
│       ├── components/    # UI components
│       ├── hooks/         # useAuth, useCrypto
│       ├── pages/         # Login, Register, Dashboard
│       └── utils/         # crypto.js
│
├── server/                # Express backend
│   └── src/
│       ├── routes/        # API routes
│       ├── controllers/   # Route handlers
│       ├── models/        # Database setup
│       └── middleware/     # Auth middleware
│
└── package.json
```

## License

This project is for educational purposes.
