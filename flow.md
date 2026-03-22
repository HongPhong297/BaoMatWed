# SecureVault - Password Manager Flow Documentation

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Zero-Knowledge Architecture](#2-zero-knowledge-architecture)
3. [Registration Flow](#3-registration-flow)
4. [Login Flow](#4-login-flow)
5. [Credential Management Flow](#5-credential-management-flow)
6. [Password Generator Flow](#6-password-generator-flow)
7. [Security Features](#7-security-features)
8. [API Endpoints](#8-api-endpoints)
9. [Database Schema](#9-database-schema)
10. [Algorithms Used](#10-algorithms-used)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Browser)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │  React UI   │    │  useCrypto   │    │  useAuth    │               │
│  │  (Pages)    │◄───►│  (Hook)      │    │  (Hook)     │               │
│  ├──────────────┤    ├──────────────┤    ├──────────────┤               │
│  │ - Login     │    │ - deriveKey  │    │ - login    │               │
│  │ - Register  │    │ - encrypt    │    │ - register │               │
│  │ - Dashboard │    │ - decrypt    │    │ - logout   │               │
│  └──────────────┘    │ - generate   │    └──────────────┘               │
│                      │   Password   │                                   │
│                      └──────────────┘                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                         Web Crypto API                                      │
│  - PBKDF2 (Key Derivation)                                                │
│  - AES-256-GCM (Encryption/Decryption)                                    │
│  - crypto.getRandomValues (CSPRNG)                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVER (Node.js + Express)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │  Routes     │    │ Controllers  │    │  Middleware │               │
│  ├──────────────┤    ├──────────────┤    ├──────────────┤               │
│  │ - /api/auth │    │ - authCtrl   │    │ - authenticate│              │
│  │ - /api/    │    │ - credCtrl   │    │   Token     │               │
│  │   credentials│    │              │    │             │               │
│  └──────────────┘    └──────────────┘    └──────────────┘               │
├─────────────────────────────────────────────────────────────────────────────┤
│                         bcrypt + JWT                                       │
│  - bcrypt (Password Hashing)                                              │
│  - jsonwebtoken (Session Management)                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ SQLite
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATABASE (SQLite)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐                                   │
│  │  users       │    │ credentials  │                                   │
│  ├──────────────┤    ├──────────────┤                                   │
│  │ - id        │    │ - id        │                                   │
│  │ - username  │    │ - user_id   │                                   │
│  │ - salt      │    │ - website   │                                   │
│  │ - password  │    │ - username  │                                   │
│  │   _hash    │    │ - encrypted │                                   │
│  │            │    │   _password │                                   │
│  │            │    │ - iv        │                                   │
│  └──────────────┘    └──────────────┘                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Zero-Knowledge Architecture

### Concept
**Zero-Knowledge** có nghĩa là server KHÔNG BAO GIỜ biết master password của user ở dạng plaintext. Tất cả mã hóa/giải mã được thực hiện ở phía client.

### Flow
```
┌─────────────┐              ┌─────────────┐              ┌─────────────┐
│   Client   │              │   Server   │              │  Database  │
├─────────────┤              ├─────────────┤              ├─────────────┤
│ Derive Key │              │           │              │           │
│ (PBKDF2)  │              │           │              │           │
│    │      │              │           │              │           │
│ Encrypt   │─────────────►│ Store     │─────────────►│ Store     │
│ (AES-GCM) │   ciphertext │  Encrypted│   Encrypted  │  Encrypted│
│           │              │  Data     │    Data      │    Data   │
└─────────────┘              └─────────────┘              └─────────────┘
       │                                                  │
       │              ┌─────────────┐                      │
       │◄────────────│   Server    │◄─────────────────────┘
       │ Decrypt    │  Returns    │
       │ (AES-GCM) │  Ciphertext │
       └────────────┘  + IV       │
```

### Security Properties
1. **Client-side encryption**: Server chỉ nhận và lưu ciphertext
2. **No plaintext storage**: Master password không được lưu ở bất kỳ đâu
3. **Key derivation on client**: PBKDF2 chạy trên browser
4. **Unique IV per encryption**: Mỗi lần mã hóa sử dụng IV khác nhau

---

## 3. Registration Flow

### Step-by-Step Process

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     REGISTRATION FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

1. USER INPUT
   ┌─────────────────────────────────────────────────────────────┐
   │  User enters:                                              │
   │  - username: "john"                                       │
   │  - masterPassword: "MySecretPassword123"                   │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
2. CLIENT: Generate Salt
   ┌─────────────────────────────────────────────────────────────┐
   │  generateSalt() → crypto.getRandomValues(16 bytes)           │
   │  → Base64 encode                                          │
   │  Result: "random16byteBase64String..."                     │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
3. CLIENT: Derive Key (PBKDF2)
   ┌─────────────────────────────────────────────────────────────┐
   │  deriveKey(masterPassword, salt)                            │
   │                                                          │
   │  PBKDF2 params:                                          │
   │  - algorithm: PBKDF2                                     │
   │  - password: "MySecretPassword123"                        │
   │  - salt: (from step 2)                                   │
   │  - iterations: 100,000                                    │
   │  - hash: SHA-256                                          │
   │  - keyLength: 32 bytes (256 bits)                         │
   │                                                          │
   │  Output: 256-bit AES key (derivedKey)                    │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
4. CLIENT: Hash Derived Key for Server
   ┌─────────────────────────────────────────────────────────────┐
   │  hashKey(derivedKey)                                      │
   │                                                          │
   │  SHA-256(derivedKey) → Base64 encode                      │
   │  Result: passwordHash (for server verification)           │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
5. CLIENT: Send to Server
   ┌─────────────────────────────────────────────────────────────┐
   │  POST /api/auth/register                                  │
   │  Body: {                                                 │
   │    username: "john",                                     │
   │    salt: "random16byteBase64String...",                  │
   │    passwordHash: "sha256Base64Hash..."                   │
   │  }                                                       │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
6. SERVER: Process Registration
   ┌─────────────────────────────────────────────────────────────┐
   │  authController.register(req, res)                           │
   │                                                          │
   │  1. Check if username exists                               │
   │     → 409 if exists                                      │
   │                                                          │
   │  2. Hash passwordHash with bcrypt                         │
   │     bcrypt.hash(passwordHash, 10)                         │
   │                                                          │
   │  3. Save to database:                                     │
   │     INSERT INTO users (username, salt, password_hash)    │
   │     VALUES ("john", salt, bcryptHash)                    │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
7. SERVER: Response
   ┌─────────────────────────────────────────────────────────────┐
   │  201 Created                                              │
   │  {                                                        │
   │    message: "User registered successfully",              │
   │    userId: 1                                             │
   │  }                                                       │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
8. CLIENT: Store Data
   ┌─────────────────────────────────────────────────────────────┐
   │  - Save salt for future login                               │
   │  - Store derivedKey in memory (NOT localStorage!)           │
   │  - derivedKey is kept in crypto module memory only          │
   └─────────────────────────────────────────────────────────────┘
```

### What is Stored Where

| Component | Stored Data | Location |
|-----------|------------|----------|
| Client Memory | derivedKey | JavaScript variables (keyRef) |
| Client Memory | salt | JavaScript variable |
| Database | salt | `users.salt` (plain Base64) |
| Database | password_hash | `users.password_hash` (bcrypt hash) |

### Important Security Note
- **Master password is NEVER sent to server**
- **Only salt + passwordHash (SHA-256 of derivedKey) is sent**
- **Server uses bcrypt to hash passwordHash for storage**

---

## 4. Login Flow

### Step-by-Step Process

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW                                        │
└─────────────────────────────────────────────────────────────────────────────┘

1. USER INPUT
   ┌─────────────────────────────────────────────────────────────┐
   │  User enters:                                              │
   │  - username: "john"                                       │
   │  - masterPassword: "MySecretPassword123"                  │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
2. CLIENT: Get Salt from Server
   ┌─────────────────────────────────────────────────────────────┐
   │  POST /api/auth/get-salt                                  │
   │  Body: { username: "john" }                               │
   │                                                          │
   │  Server returns:                                          │
   │  { salt: "random16byteBase64String..." }                  │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
3. CLIENT: Derive Key (PBKDF2)
   ┌─────────────────────────────────────────────────────────────┐
   │  deriveKey(masterPassword, salt)                            │
   │                                                          │
   │  Same process as registration:                           │
   │  - PBKDF2 with 100,000 iterations                        │
   │  - SHA-256 hash                                          │
   │  - 256-bit key output                                    │
   │                                                          │
   │  Result: derivedKey (in memory)                          │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
4. CLIENT: Hash Derived Key
   ┌─────────────────────────────────────────────────────────────┐
   │  hashKey(derivedKey) → SHA-256 → Base64                   │
   │                                                          │
   │  Result: passwordHash                                     │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
5. CLIENT: Send to Server
   ┌─────────────────────────────────────────────────────────────┐
   │  POST /api/auth/login                                     │
   │  Body: {                                                  │
   │    username: "john",                                      │
   │    passwordHash: "sha256Base64Hash..."                   │
   │  }                                                       │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
6. SERVER: Verify Credentials
   ┌─────────────────────────────────────────────────────────────┐
   │  authController.login(req, res)                            │
   │                                                          │
   │  1. Get user from database                                │
   │     SELECT * FROM users WHERE username = "john"          │
   │                                                          │
   │  2. Verify passwordHash with stored hash                  │
   │     bcrypt.compare(passwordHash, storedHash)               │
   │                                                          │
   │  3. If valid, generate JWT token                          │
   │     jwt.sign({ id, username }, JWT_SECRET, { expiresIn: 24h })│
   │                                                          │
   │  4. Return:                                               │
   │     { token, user: { id, username, salt } }               │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
7. CLIENT: Store Token and Initialize Crypto
   ┌─────────────────────────────────────────────────────────────┐
   │  localStorage:                                             │
   │  - auth_token: JWT token                                  │
   │  - auth_user: { id, username }                            │
   │                                                          │
   │  Memory (crypto module):                                   │
   │  - derivedKey: (kept in keyRef, never persisted)          │
   └─────────────────────────────────────────────────────────────┘
```

### Session Management

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SESSION MANAGEMENT                                   │
└─────────────────────────────────────────────────────────────────────────────┘

JWT Token Structure:
{
  "id": 1,
  "username": "john",
  "iat": 1234567890,        // Issued At
  "exp": 1234579890         // Expires in 24 hours
}

Token is sent in each request header:
Authorization: Bearer <jwt_token>

Server verifies token on each protected request via middleware.
```

---

## 5. Credential Management Flow

### 5.1 Add New Credential

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ADD CREDENTIAL FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

1. USER INPUT
   ┌─────────────────────────────────────────────────────────────┐
   │  User fills form:                                        │
   │  - website: "github.com"                                │
   │  - username: "johndev"                                   │
   │  - password: "github_password_123"                      │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
2. CLIENT: Encrypt Password
   ┌─────────────────────────────────────────────────────────────┐
   │  encryptPassword(password)                                │
   │                                                          │
   │  1. Generate IV (12 bytes)                               │
   │     generateIV() → crypto.getRandomValues(12)            │
   │                                                          │
   │  2. Encrypt with AES-256-GCM                             │
   │     AES-256-GCM(plaintext, derivedKey, iv)               │
   │                                                          │
   │  Output:                                                │
   │  - ciphertext: (Base64 encoded encrypted data)          │
   │  - iv: (Base64 encoded initialization vector)           │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
3. CLIENT: Send to Server
   ┌─────────────────────────────────────────────────────────────┐
   │  POST /api/credentials                                  │
   │  Headers: Authorization: Bearer <jwt_token>           │
   │  Body: {                                              │
   │    website: "github.com",                              │
   │    username: "johndev",                               │
   │    encryptedPassword: "base64Ciphertext...",          │
   │    iv: "base64IV..."                                  │
   │  }                                                    │
   │                                                          │
   │  NOTE: No passwordHash required (JWT only)            │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
4. SERVER: Verify JWT
   ┌─────────────────────────────────────────────────────────────┐
   │  authenticateToken middleware                           │
   │                                                          │
   │  jwt.verify(token, JWT_SECRET)                         │
   │  → Extract user.id from token                           │
   │  → Set req.user = { id, username }                     │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
5. SERVER: Save Credential
   ┌─────────────────────────────────────────────────────────────┐
   │  credentialsController.addCredential                       │
   │                                                          │
   │  1. Extract userId from req.user.id                     │
   │                                                          │
   │  2. Insert into database:                                │
   │     INSERT INTO credentials                             │
   │     (user_id, website, username, encrypted_password, iv)│
   │     VALUES (1, "github.com", "johndev", ciphertext, iv) │
   │                                                          │
   │  3. Return:                                             │
   │     { message: "Credential added successfully", id }     │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
6. CLIENT: Update UI
   ┌─────────────────────────────────────────────────────────────┐
   │  - Fetch updated credentials list                        │
   │  - Display in CredentialList component                   │
   │  - Show form closed                                     │
   └─────────────────────────────────────────────────────────────┘
```

### 5.2 View Credential

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VIEW CREDENTIAL FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

1. CLIENT: Request Credentials
   ┌─────────────────────────────────────────────────────────────┐
   │  GET /api/credentials                                   │
   │  Headers: Authorization: Bearer <jwt_token>             │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
2. SERVER: Return Encrypted Data
   ┌─────────────────────────────────────────────────────────────┐
   │  [                                                       │
   │    {                                                     │
   │      id: 1,                                            │
   │      website: "github.com",                               │
   │      username: "johndev",                               │
   │      encryptedPassword: "base64Ciphertext...",          │
   │      iv: "base64IV...",                                │
   │      createdAt: "2024-01-01..."                        │
   │    }                                                    │
   │  ]                                                       │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
3. CLIENT: Display List (Encrypted)
   ┌─────────────────────────────────────────────────────────────┐
   │  CredentialList shows:                                  │
   │  - website: "github.com" (plaintext)                     │
   │  - username: "johndev" (plaintext)                       │
   │  - password: "●●●●●●●●" (masked)                         │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
4. USER: Click "View Password"
   ┌─────────────────────────────────────────────────────────────┐
   │  User clicks eye icon to reveal password                  │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
5. CLIENT: Decrypt Password
   ┌─────────────────────────────────────────────────────────────┐
   │  decryptPassword(ciphertext, iv)                         │
   │                                                          │
   │  AES-256-GCM decrypt:                                    │
   │  - Input: ciphertext + iv + derivedKey                  │
   │  - Output: plaintext password                           │
   │                                                          │
   │  Result: "github_password_123"                          │
   │                                                          │
   │  Store in decryptedPasswords state                      │
   │  Display in UI                                          │
   └─────────────────────────────────────────────────────────────┘
```

### 5.3 Edit Credential

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EDIT CREDENTIAL FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

1. USER: Edit form
   ┌─────────────────────────────────────────────────────────────┐
   │  User modifies:                                           │
   │  - website: "github.com" → "gitlab.com"                  │
   │  - username: "johndev" → "johngitlab"                   │
   │  - password: "old_password" → "new_password"           │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
2. CLIENT: Re-encrypt (NEW IV)
   ┌─────────────────────────────────────────────────────────────┐
   │  encryptPassword(newPassword)                             │
   │                                                          │
   │  Generate NEW IV (12 bytes)                             │
   │  Encrypt with AES-256-GCM                                │
   │                                                          │
   │  Output: newCiphertext, newIV                           │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
3. CLIENT: Send to Server
   ┌─────────────────────────────────────────────────────────────┐
   │  PUT /api/credentials/:id                                │
   │  Headers: Authorization: Bearer <jwt_token>             │
   │  Body: {                                                │
   │    website: "gitlab.com",                               │
   │    username: "johngitlab",                            │
   │    encryptedPassword: "newBase64Ciphertext...",     │
   │    iv: "newBase64IV..."                               │
   │  }                                                      │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
4. SERVER: Update
   ┌─────────────────────────────────────────────────────────────┐
   │  UPDATE credentials                                     │
   │  SET website = ?, username = ?,                         │
   │      encrypted_password = ?, iv = ?                   │
   │  WHERE id = ? AND user_id = ?                         │
   │                                                          │
   │  Only updates if user_id matches (security)           │
   └─────────────────────────────────────────────────────────────┘
```

### 5.4 Delete Credential

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DELETE CREDENTIAL FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

1. USER: Click Delete
   ┌─────────────────────────────────────────────────────────────┐
   │  User clicks delete icon on credential                     │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
2. CLIENT: Send Delete Request
   ┌─────────────────────────────────────────────────────────────┐
   │  DELETE /api/credentials/:id                             │
   │  Headers: Authorization: Bearer <jwt_token>              │
   │                                                          │
   │  NO password verification needed (JWT only)             │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
3. SERVER: Delete
   ┌─────────────────────────────────────────────────────────────┐
   │  DELETE FROM credentials                               │
   │  WHERE id = ? AND user_id = ?                          │
   │                                                          │
   │  Only deletes if user_id matches (security)           │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
4. CLIENT: Update UI
   ┌─────────────────────────────────────────────────────────────┐
   │  - Remove from local state                              │
   │  - Fetch updated list                                   │
   └─────────────────────────────────────────────────────────────┘
```

---

## 6. Password Generator Flow

### Step-by-Step Process

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  PASSWORD GENERATOR FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

1. USER: Configure Options
   ┌─────────────────────────────────────────────────────────────┐
   │  Length: 16 (default, range 8-64)                         │
   │  Options:                                                  │
   │  □ Uppercase (A-Z)                                        │
   │  □ Lowercase (a-z)                                        │
   │  □ Numbers (0-9)                                          │
   │  □ Special (!@#$%^&*...)                                  │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
2. CLIENT: Generate Using CSPRNG
   ┌─────────────────────────────────────────────────────────────┐
   │  generatePassword(options)                                │
   │                                                          │
   │  1. Build charset from options:                           │
   │     charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +            │
   │               "abcdefghijklmnopqrstuvwxyz" +            │
   │               "0123456789" +                             │
   │               "!@#$%^&*()_+-=[]{}|;:,.<>?"               │
   │                                                          │
   │  2. Generate random bytes:                                │
   │     crypto.getRandomValues(new Uint8Array(length))       │
   │                                                          │
   │  3. Build password:                                      │
   │     For each byte: password += charset[byte % charset.length]│
   │                                                          │
   │  Result: "Ab3$kL9@mN2#pQ5rT8" (16 chars)               │
   └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
3. SECURITY: Why CSPRNG?
   ┌─────────────────────────────────────────────────────────────┐
   │  crypto.getRandomValues() uses OS CSPRNG:                 │
   │  - Windows: CryptGenRandom()                              │
   │  - macOS: SecRandomCopyBytes()                           │
   │  - Linux: /dev/urandom                                  │
   │                                                          │
   │  NOT math.random() - which is predictable!             │
   └─────────────────────────────────────────────────────────────┘
```

---

## 7. Security Features

### 7.1 Auto-Lock

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AUTO-LOCK FEATURE                                 │
└─────────────────────────────────────────────────────────────────────────────┘

Configuration:
- Timeout: 5 minutes (300,000 ms)
- Check interval: 30 seconds

Implementation:
- Track user activity (mousemove, keydown, click)
- On each activity, update lastActivity timestamp
- Every 30 seconds, check: if (now - lastActivity > timeout) → logout

On Auto-Lock:
1. crypto.clearKey() → Clear derivedKey from memory
2. localStorage.removeItem('auth_token')
3. localStorage.removeItem('auth_user')
4. Redirect to login page
```

### 7.2 Clipboard Auto-Clear

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CLIPBOARD AUTO-CLEAR                                    │
└─────────────────────────────────────────────────────────────────────────────┘

Feature: Copy password → Auto-clear after 30 seconds

Implementation (in CredentialList component):
- navigator.clipboard.writeText(password)
- setTimeout(() => {
    navigator.clipboard.writeText('');
  }, 30000);
```

### 7.3 Session Security

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SESSION SECURITY                                      │
└─────────────────────────────────────────────────────────────────────────────┘

JWT Token:
- Expiration: 24 hours
- Algorithm: HS256 (HMAC SHA-256)
- Secret: JWT_SECRET (from environment variable)

Token contains:
{
  id: user.id,
  username: user.username,
  iat: issued_at,
  exp: expiration_time
}

Each request verification:
- Check token exists in header
- Verify signature with JWT_SECRET
- Check expiration not passed
- Extract user.id for database queries
```

---

## 8. API Endpoints

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register new user |
| POST | `/api/auth/login` | None | Login, returns JWT |
| POST | `/api/auth/get-salt` | None | Get salt for username |

### Credential Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/credentials` | JWT | List all credentials |
| GET | `/api/credentials/:id` | JWT | Get single credential |
| POST | `/api/credentials` | JWT | Add new credential |
| PUT | `/api/credentials/:id` | JWT | Update credential |
| DELETE | `/api/credentials/:id` | JWT | Delete credential |

### Request/Response Examples

```
POST /api/auth/register
Request:
{
  "username": "john",
  "salt": "random16byteBase64String...",
  "passwordHash": "sha256Base64Hash..."
}
Response (201):
{
  "message": "User registered successfully",
  "userId": 1
}

POST /api/auth/login
Request:
{
  "username": "john",
  "passwordHash": "sha256Base64Hash..."
}
Response (200):
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "john",
    "salt": "random16byteBase64String..."
  }
}

GET /api/credentials
Headers: Authorization: Bearer <jwt_token>
Response (200):
[
  {
    "id": 1,
    "website": "github.com",
    "username": "johndev",
    "encryptedPassword": "base64Ciphertext...",
    "iv": "base64IV...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]

POST /api/credentials
Headers: Authorization: Bearer <jwt_token>
Request:
{
  "website": "github.com",
  "username": "johndev",
  "encryptedPassword": "base64Ciphertext...",
  "iv": "base64IV..."
}
Response (201):
{
  "message": "Credential added successfully",
  "id": 1
}
```

---

## 9. Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key, auto-increment |
| username | TEXT | Unique username |
| salt | TEXT | Base64 encoded salt (16 bytes) |
| password_hash | TEXT | bcrypt hash of passwordHash |
| created_at | DATETIME | Creation timestamp |

### Credentials Table

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

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key, auto-increment |
| user_id | INTEGER | Foreign key to users |
| website | TEXT | Website URL/name |
| username | TEXT | Username for the website |
| encrypted_password | TEXT | Base64 encrypted password (AES-GCM) |
| iv | TEXT | Base64 initialization vector |
| created_at | DATETIME | Creation timestamp |

### Security Note
- Database stores ONLY encrypted data
- Even if database is compromised, attacker cannot read passwords
- Only user with correct master password can decrypt

---

## 10. Algorithms Used

### 10.1 PBKDF2 (Password-Based Key Derivation Function 2)

```
Purpose: Derive cryptographic key from master password

Parameters:
- Algorithm: PBKDF2
- Password: User's master password
- Salt: 16 bytes (128 bits), randomly generated per user
- Iterations: 100,000 (high for security)
- Hash: SHA-256
- Key Length: 32 bytes (256 bits)

Output: 256-bit AES key

Why 100,000 iterations?
- Increases computational cost for brute-force attacks
- Balances security vs. user experience (~100-500ms derivation time)
```

### 10.2 AES-256-GCM (Advanced Encryption Standard - Galois/Counter Mode)

```
Purpose: Encrypt/decrypt passwords

Parameters:
- Algorithm: AES-256-GCM
- Key: 256-bit derived key
- IV: 12 bytes (96 bits), randomly generated per encryption
- Mode: GCM (provides authentication)

Encryption:
ciphertext = AES-256-GCM(plaintext, key, iv)

Decryption:
plaintext = AES-256-GCM-decrypt(ciphertext, key, iv)

Why GCM?
- Provides confidentiality + authenticity
- IV should never be reused with same key (ensured by random IV per encryption)
- Standard for authenticated encryption
```

### 10.3 SHA-256 (Secure Hash Algorithm)

```
Purpose:
1. Hash derived key for server verification
2. Password hashing in PBKDF2

Output: 256-bit (32 bytes) hash

Usage in this app:
- hashKey(derivedKey) → SHA-256 → Base64 → passwordHash
- PBKDF2 internal hash function
```

### 10.4 bcrypt

```
Purpose: Hash passwordHash for database storage

Parameters:
- Algorithm: bcrypt
- Salt: Auto-generated
- Rounds: 10 (cost factor)

Why bcrypt?
- Designed for password hashing
- Slow by design (resistant to brute-force)
- Includes salt automatically
```

### 10.5 JWT (JSON Web Token)

```
Purpose: Session management

Parameters:
- Algorithm: HS256 (HMAC SHA-256)
- Secret: JWT_SECRET (environment variable)
- Expiration: 24 hours

Token Structure:
{
  "id": 1,
  "username": "john",
  "iat": 1234567890,
  "exp": 1234579890
}

Signature: HMAC-SHA256(header.payload, secret)
```

### 10.6 CSPRNG (Cryptographically Secure Pseudo-Random Number Generator)

```
Purpose: Generate random bytes for:
- Salt (16 bytes)
- IV (12 bytes)
- Password generation

Implementation:
- Browser: crypto.getRandomValues()
- Uses OS-level CSPRNG

NOT using: Math.random() (predictable!)
```

---

## Summary: Security Properties

| Property | How It's Achieved |
|----------|------------------|
| Zero-Knowledge | Client-side encryption, server never sees plaintext |
| Key Derivation | PBKDF2 with 100,000 iterations |
| Encryption | AES-256-GCM with unique IV per operation |
| Password Storage | bcrypt hash (NOT plaintext) |
| Session Management | JWT with 24-hour expiration |
| Auto-Lock | 5-minute inactivity timeout |
| Clipboard Security | 30-second auto-clear |
| Database Security | Only encrypted data stored |

---

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE DATA FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

REGISTER:
User ──► [Client] ──► generateSalt() ──► deriveKey() ──► hashKey()
                     ──► POST /api/auth/register ──► bcrypt.hash()
                     ──► INSERT INTO users ──► [Database]

LOGIN:
User ──► [Client] ──► POST /api/auth/get-salt ──► [Database]
                     ──► deriveKey() ──► hashKey() ──► POST /api/auth/login
                     ──► bcrypt.compare() ──► jwt.sign() ──► [Database]
                     ──► localStorage.setItem(token) ──► deriveKey() (in memory)

ADD CREDENTIAL:
User ──► [Client Form] ──► encryptPassword() ──► POST /api/credentials + JWT
                        ──► INSERT INTO credentials ──► [Database]

VIEW CREDENTIAL:
User ──► GET /api/credentials + JWT ──► [Database]
       ──► Display list ──► decryptPassword() ──► Show plaintext

DELETE CREDENTIAL:
User ──► DELETE /api/credentials/:id + JWT ──► DELETE FROM credentials
       ──► [Database] ──► Update UI
```

---

*Document Version: 1.0*
*Last Updated: 2024*
*SecureVault - Password Manager*
