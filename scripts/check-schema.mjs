#!/usr/bin/env node
/**
 * Drift detection: compares the local graphql/schema.graphql with the
 * authoritative copy in the backend repository.
 *
 * Exit 0 = in sync. Exit 1 = drift detected (or fetch error).
 */

import { readFileSync } from 'fs';
import { createHash } from 'crypto';

const BACKEND_SCHEMA_URL =
  'https://raw.githubusercontent.com/Lumeeena/lumina-backend/main/graphql-server/src/schema.graphql';

const LOCAL_PATH = new URL('../graphql/schema.graphql', import.meta.url).pathname
  // On Windows the URL pathname starts with /C:/... — strip the leading slash.
  .replace(/^\/([A-Z]:)/, '$1');

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

async function main() {
  // Read local schema
  let local;
  try {
    local = readFileSync(LOCAL_PATH, 'utf8');
  } catch (err) {
    console.error(`[check-schema] Cannot read local schema at ${LOCAL_PATH}: ${err.message}`);
    process.exit(1);
  }

  // Fetch remote schema
  let remote;
  try {
    const res = await fetch(BACKEND_SCHEMA_URL);
    if (!res.ok) {
      console.error(`[check-schema] Backend schema fetch failed: ${res.status} ${res.statusText}`);
      process.exit(1);
    }
    remote = await res.text();
  } catch (err) {
    console.error(`[check-schema] Network error fetching backend schema: ${err.message}`);
    process.exit(1);
  }

  const localHash = sha256(local.trim());
  const remoteHash = sha256(remote.trim());

  if (localHash === remoteHash) {
    console.log('[check-schema] graphql/schema.graphql is in sync with the backend.');
    process.exit(0);
  }

  // Provide a minimal diff summary: count added/removed lines
  const localLines = new Set(local.split('\n').map(l => l.trim()).filter(Boolean));
  const remoteLines = new Set(remote.split('\n').map(l => l.trim()).filter(Boolean));

  const added = [...remoteLines].filter(l => !localLines.has(l));
  const removed = [...localLines].filter(l => !remoteLines.has(l));

  console.error('[check-schema] DRIFT DETECTED — graphql/schema.graphql is out of sync.');
  console.error(`  Lines only in backend (+${added.length}):`);
  added.slice(0, 10).forEach(l => console.error(`    + ${l}`));
  if (added.length > 10) console.error(`    … and ${added.length - 10} more`);
  console.error(`  Lines only in local  (-${removed.length}):`);
  removed.slice(0, 10).forEach(l => console.error(`    - ${l}`));
  if (removed.length > 10) console.error(`    … and ${removed.length - 10} more`);
  console.error('  Run: node scripts/sync-schema.mjs   (or copy the backend schema manually)');
  process.exit(1);
}

main();
