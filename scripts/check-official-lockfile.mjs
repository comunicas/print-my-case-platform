#!/usr/bin/env node
import { existsSync } from 'node:fs';

const forbiddenLockfiles = ['bun.lock', 'bun.lockb', 'yarn.lock', 'pnpm-lock.yaml'];

const found = forbiddenLockfiles.filter((file) => existsSync(file));

if (found.length > 0) {
  console.error('❌ Lockfiles não oficiais encontrados:');
  for (const file of found) {
    console.error(`- ${file}`);
  }
  console.error('\nUse apenas package-lock.json com npm ci.');
  process.exit(1);
}

console.log('✅ Lockfiles validados: somente package-lock.json está presente.');
