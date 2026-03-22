import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import https from 'https';
import http from 'http';
import fs from 'fs';
import authRoutes from './routes/auth.js';
import credentialsRoutes from './routes/credentials.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

// Middleware
app.use(cors());
app.use(express.json());

// Security headers
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/credentials', credentialsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SecureVault API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server with HTTPS support
const startServer = () => {
  const sslOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH || './ssl/server.key'),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH || './ssl/server.crt')
  };

  // Start HTTPS server
  https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
    console.log(`HTTPS Server running on https://localhost:${HTTPS_PORT}`);
  });

  // Also start HTTP server (for development)
  http.createServer(app).listen(PORT, () => {
    console.log(`HTTP Server running on http://localhost:${PORT}`);
  });
};

// Check if SSL certificates exist for production
const sslKeyExists = fs.existsSync(process.env.SSL_KEY_PATH || './ssl/server.key');
const sslCertExists = fs.existsSync(process.env.SSL_CERT_PATH || './ssl/server.crt');

if (sslKeyExists && sslCertExists) {
  startServer();
} else {
  // Development mode - HTTP only with warning
  console.warn('WARNING: Running in HTTP mode. HTTPS certificates not found.');
  console.warn('For production, add SSL_KEY_PATH and SSL_CERT_PATH to .env');
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
