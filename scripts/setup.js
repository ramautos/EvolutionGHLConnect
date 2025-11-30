#!/usr/bin/env node

/**
 * Setup Script for EvolutionGHLConnect
 *
 * This script automates the initial setup process:
 * 1. Verifies Node.js version
 * 2. Creates .env file from template
 * 3. Validates environment structure
 */

import { existsSync } from 'fs';
import { copyFile, readFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, colors.green);
}

function warning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function error(message) {
  log(`✗ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ ${message}`, colors.blue);
}

async function checkNodeVersion() {
  info('Checking Node.js version...');

  try {
    const { stdout } = await execAsync('node --version');
    const version = stdout.trim();
    const majorVersion = parseInt(version.slice(1).split('.')[0]);

    if (majorVersion < 18) {
      error(`Node.js ${majorVersion} detected. Node.js 18+ is required.`);
      process.exit(1);
    }

    success(`Node.js ${version} detected`);
  } catch (err) {
    error('Failed to check Node.js version');
    throw err;
  }
}

async function createEnvFile() {
  info('Setting up environment file...');

  const envPath = '.env';
  const examplePath = '.env.example';

  if (!existsSync(examplePath)) {
    error('.env.example not found!');
    process.exit(1);
  }

  if (existsSync(envPath)) {
    warning('.env already exists, skipping...');
    return;
  }

  try {
    await copyFile(examplePath, envPath);
    success('.env file created');
    warning('Please edit .env with your actual credentials');
  } catch (err) {
    error('Failed to create .env file');
    throw err;
  }
}

async function displayNextSteps() {
  console.log('\n' + '='.repeat(60));
  log('Setup Complete!', colors.green);
  console.log('='.repeat(60) + '\n');

  info('Next steps:\n');
  console.log('  1. Edit .env file with your credentials:');
  console.log('     - DATABASE_URL');
  console.log('     - GHL_CLIENT_ID and GHL_CLIENT_SECRET');
  console.log('     - EVOLUTION_API_URL and EVOLUTION_API_KEY');
  console.log('     - STRIPE_SECRET_KEY');
  console.log('     - SESSION_SECRET\n');

  console.log('  2. Push database schema:');
  console.log('     npm run db:push\n');

  console.log('  3. Start development server:');
  console.log('     npm run dev\n');

  console.log('  4. Open your browser:');
  console.log('     http://localhost:5000\n');

  console.log('='.repeat(60) + '\n');

  warning('Run "npm run verify" to check if all environment variables are set');
}

async function main() {
  try {
    log('\n🚀 EvolutionGHLConnect Setup\n', colors.blue);

    await checkNodeVersion();
    console.log();

    await createEnvFile();
    console.log();

    await displayNextSteps();

  } catch (err) {
    console.error('\n');
    error('Setup failed:');
    console.error(err);
    process.exit(1);
  }
}

main();
