// utils/validation.js - Validation utilities
/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} - Validation result
 */
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  /**
   * Validate password strength
   * @param {string} password - Password
   * @returns {boolean} - Validation result
   */
  const validatePassword = (password) => {
    if (!password || password.length < 8) return false;
    
    // Check for at least one uppercase, lowercase, digit, and special character
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    return hasUpper && hasLower && hasDigit && hasSpecial;
  };
  
  /**
   * Validate Discord ID format
   * @param {string} discordId - Discord user ID
   * @returns {boolean} - Validation result
   */
  const validateDiscordId = (discordId) => {
    return /^\d{17,19}$/.test(discordId);
  };
  
  /**
   * Sanitize user input
   * @param {string} input - User input
   * @returns {string} - Sanitized input
   */
  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '');
  };
  
  /**
   * Validate API request payload
   * @param {object} payload - Request payload
   * @param {object} schema - Validation schema
   * @returns {object} - Validation result
   */
  const validatePayload = (payload, schema) => {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = payload[field];
      
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }
      
      if (value !== undefined) {
        if (rules.type && typeof value !== rules.type) {
          errors.push(`${field} must be of type ${rules.type}`);
        }
        
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }
        
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must be no more than ${rules.maxLength} characters`);
        }
        
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }
        
        if (rules.custom && !rules.custom(value)) {
          errors.push(`${field} is invalid`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  module.exports = {
    validateEmail,
    validatePassword,
    validateDiscordId,
    sanitizeInput,
    validatePayload
  };
  