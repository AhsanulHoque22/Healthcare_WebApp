#!/usr/bin/env node

/**
 * Email Validation Debug Script
 */

const testEmails = [
  'valid@example.com',
  'invalid-email',
  'test@',
  '@example.com',
  'test@example',
  'test.email@example.com',
  '',
  ' ',
  'ratulahr124@gmail.com'
];

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

console.log('🧪 Testing Email Validation Regex...\n');

testEmails.forEach(email => {
  const normalized = email.trim().toLowerCase();
  const isValid = emailRegex.test(normalized);
  console.log(`Email: "${email}" -> "${normalized}" -> ${isValid ? '✅ VALID' : '❌ INVALID'}`);
});

console.log('\n🔍 Regex pattern:', emailRegex.toString());
