#!/usr/bin/env node
/**
 * safe-dev.js — Run this instead of `npm run dev`
 * Kills any stale Node processes holding .next/trace before starting fresh.
 */
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '.next');

console.log('🧹 Clearing stale Node processes...');
try {
  execSync('taskkill /F /IM node.exe 2>nul', { stdio: 'pipe' });
} catch (_) {}

// Short wait for processes to die
require('timers').setTimeout(() => {
  console.log('🗑️  Removing .next cache...');
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
  } catch (_) {}

  console.log('🚀 Starting Next.js dev server...\n');
  const child = spawn('npx', ['next', 'dev', '-H', '0.0.0.0'], {
    stdio: 'inherit',
    shell: true,
  });

  child.on('exit', (code) => process.exit(code ?? 0));
}, 1500);
