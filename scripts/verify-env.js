#!/usr/bin/env node

/**
 * Environment Variables Verification Script
 *
 * Validates that all required environment variables are set.
 * Run this before starting the application.
 */

import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load .env file
config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Required environment variables
const requiredVars = {
  // Database
  DATABASE_URL: {
    description: 'PostgreSQL connection string',
    example: 'postgresql://user:password@host:5432/database',
  },

  // GoHighLevel OAuth
  GHL_CLIENT_ID: {
    description: 'GoHighLevel OAuth Client ID',
    example: 'your_client_id',
  },
  GHL_CLIENT_SECRET: {
    description: 'GoHighLevel OAuth Client Secret',
    example: 'your_client_secret',
  },

  // Evolution API
  EVOLUTION_API_URL: {
    description: 'Evolution API base URL',
    example: 'https://your-evolution-api.com',
  },
  EVOLUTION_API_KEY: {
    description: 'Evolution API authentication key',
    example: 'your_api_key',
  },

  // Stripe
  STRIPE_SECRET_KEY: {
    description: 'Stripe secret key',
    example: 'sk_test_xxxxxxxxxxxxx',
  },
  STRIPE_WEBHOOK_SECRET: {
    description: 'Stripe webhook secret',
    example: 'whsec_xxxxxxxxxxxxx',
  },

  // Application
  SESSION_SECRET: {
    description: 'Express session secret (random string)',
    example: 'your_random_session_secret_here',
  },

  // Frontend
  VITE_GHL_CLIENT_ID: {
    description: 'GHL Client ID for frontend (must match GHL_CLIENT_ID)',
    example: 'your_client_id',
  },
};

// Optional but recommended
const optionalVars = {
  N8N_API_URL: 'n8n API base URL',
  N8N_API_KEY: 'n8n API authentication key',
  N8N_WEBHOOK_URL: 'n8n webhook URL for Evolution API events',
  APP_URL: 'Application public URL',
  SERVER_URL: 'Server public URL',
};

function verifyEnvironment() {
  console.log('\n🔍 Verifying Environment Variables\n');

  const missing = [];
  const invalid = [];
  const warnings = [];

  // Check required variables
  for (const [key, config] of Object.entries(requiredVars)) {
    const value = process.env[key];

    if (!value) {
      missing.push({ key, ...config });
    } else if (value === config.example || value.includes('your_')) {
      invalid.push({ key, value, ...config });
    } else {
      log(`✓ ${key}`, colors.green);
    }
  }

  // Check optional variables
  console.log('\nOptional variables:');
  for (const [key, description] of Object.entries(optionalVars)) {
    const value = process.env[key];

    if (!value) {
      warnings.push({ key, description });
      log(`⚠ ${key} (not set)`, colors.yellow);
    } else {
      log(`✓ ${key}`, colors.green);
    }
  }

  // Special validations
  console.log('\nSpecial validations:');

  // GHL_CLIENT_ID should match VITE_GHL_CLIENT_ID
  if (process.env.GHL_CLIENT_ID !== process.env.VITE_GHL_CLIENT_ID) {
    log('⚠ GHL_CLIENT_ID and VITE_GHL_CLIENT_ID should match', colors.yellow);
    warnings.push({
      key: 'GHL_CLIENT_ID / VITE_GHL_CLIENT_ID',
      description: 'These values should be identical',
    });
  } else if (process.env.GHL_CLIENT_ID) {
    log('✓ GHL_CLIENT_ID matches VITE_GHL_CLIENT_ID', colors.green);
  }

  // Report results
  console.log('\n' + '='.repeat(60));

  if (missing.length > 0) {
    log('\n✗ Missing required environment variables:', colors.red);
    missing.forEach(({ key, description, example }) => {
      console.log(`\n  ${key}`);
      console.log(`    Description: ${description}`);
      console.log(`    Example: ${example}`);
    });
  }

  if (invalid.length > 0) {
    log('\n⚠ Invalid environment variables (using example values):', colors.yellow);
    invalid.forEach(({ key, value }) => {
      console.log(`\n  ${key} = ${value}`);
      console.log(`    Please update this with your actual value`);
    });
  }

  if (warnings.length > 0 && missing.length === 0 && invalid.length === 0) {
    log('\n⚠ Warnings:', colors.yellow);
    warnings.forEach(({ key, description }) => {
      console.log(`  ${key}: ${description}`);
    });
  }

  console.log('\n' + '='.repeat(60) + '\n');

  if (missing.length > 0 || invalid.length > 0) {
    log('✗ Environment validation failed', colors.red);
    log('\nPlease check .env.example for reference', colors.yellow);
    process.exit(1);
  } else if (warnings.length > 0) {
    log('⚠ Environment validation passed with warnings', colors.yellow);
    log('Application should work, but some features might be limited\n', colors.yellow);
  } else {
    log('✓ All environment variables are properly configured!', colors.green);
    log('You can now run: npm run dev\n', colors.green);
  }
}

// Run verification
verifyEnvironment();
