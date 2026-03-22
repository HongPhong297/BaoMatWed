import bcrypt from 'bcrypt';
import { createUser, getUserByUsername } from '../models/database.js';
import { generateToken } from '../middleware/auth.js';

export async function getSalt(req, res) {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      salt: user.salt
    });
  } catch (error) {
    console.error('Get salt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function register(req, res) {
  try {
    const { username, salt, passwordHash } = req.body;

    if (!username || !salt || !passwordHash) {
      return res.status(400).json({ error: 'Username, salt, and passwordHash are required' });
    }

    // Check if user already exists
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Hash the derived key before storing
    const hashedPassword = await bcrypt.hash(passwordHash, 10);

    // Create new user
    const userId = await createUser(username, salt, hashedPassword);

    res.status(201).json({
      message: 'User registered successfully',
      userId
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function login(req, res) {
  try {
    const { username, passwordHash } = req.body;

    if (!username || !passwordHash) {
      return res.status(400).json({ error: 'Username and passwordHash are required' });
    }

    // Get user by username
    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password hash
    const isValid = await bcrypt.compare(passwordHash, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        salt: user.salt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
