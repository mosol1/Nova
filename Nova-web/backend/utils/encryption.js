// utils/encryption.js - Encryption utilities
const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt data using AES-256-CBC
 * @param {string} text - Text to encrypt
 * @param {string} key - Encryption key (32 characters)
 * @returns {string} - Encrypted hex string
 */
const encryptData = (text, key) => {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    throw new Error('Encryption failed: ' + error.message);
  }
};

/**
 * Decrypt data using AES-256-CBC
 * @param {string} encryptedData - Encrypted hex string
 * @param {string} key - Encryption key (32 characters)
 * @returns {string} - Decrypted text
 */
const decryptData = (encryptedData, key) => {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      // Handle direct hex decryption (matching C# implementation)
      const decipher = crypto.createDecipher(ALGORITHM, key);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed: ' + error.message);
  }
};

/**
 * Generate a secure random key
 * @param {number} length - Key length in bytes
 * @returns {string} - Random key in hex
 */
const generateKey = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash password using bcrypt-compatible method
 * @param {string} password - Plain text password
 * @param {number} rounds - Salt rounds (default: 12)
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password, rounds = 12) => {
  const bcrypt = require('bcryptjs');
  return await bcrypt.hash(password, rounds);
};

/**
 * Verify password against hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - Verification result
 */
const verifyPassword = async (password, hash) => {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(password, hash);
};

module.exports = {
  encryptData,
  decryptData,
  generateKey,
  hashPassword,
  verifyPassword
};