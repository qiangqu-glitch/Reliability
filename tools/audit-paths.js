#!/usr/bin/env node
/**
 * Case-sensitivity path auditor for ReliToolbox
 *
 * Purpose: Windows/macOS file systems are case-insensitive by default;
 * GitHub Pages runs Linux, which IS case-sensitive. A path like
 * `../DB/relidb.js` works on Windows but 404s on GitHub Pages.
 *
 * This script scans all .html files for `src="..."` and `href="..."`,
 * resolves the target against the real on-disk filename, and reports
 * any mismatch in casing. Skips external URLs and absolute paths.
 *
 * Usage:
 *   node tools/audit-paths.js        # exits 1 if any mismatch
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'tests', 'tools']);

function walkHTML(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHTML(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
}

// Real case of a file on disk (returns null if file does not exist)
function realCase(p) {
  try {
    const dir = path.dirname(p);
    const base = path.basename(p);
    const entries = fs.readdirSync(dir);
    const hit = entries.find(e => e.toLowerCase() === base.toLowerCase());
    if (!hit) return null;
    if (dir === path.dirname(dir)) return path.join(dir, hit); // root
    const parentReal = realCase(dir);
    if (!parentReal) return null;
    return path.join(parentReal, hit);
  } catch (e) {
    return null;
  }
}

const files = [];
walkHTML(ROOT, files);

const issues = [];
const ATTR_RE = /\b(?:src|href)\s*=\s*["']([^"']+)["']/gi;

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  let m;
  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(src)) !== null) {
    const ref = m[1].split('#')[0].split('?')[0];
    if (!ref) continue;
    if (/^(https?:|data:|mailto:|tel:|javascript:|#)/i.test(ref)) continue;
    if (ref.startsWith('/')) continue; // absolute site-paths — not our concern here
    const target = path.resolve(path.dirname(f), ref);
    if (!fs.existsSync(target)) {
      // Use case-insensitive lookup to catch mismatches
      const real = realCase(target);
      if (!real) {
        issues.push({ file: path.relative(ROOT, f), ref, problem: 'MISSING' });
      } else if (real !== target) {
        issues.push({
          file: path.relative(ROOT, f),
          ref,
          problem: 'CASE_MISMATCH',
          expected: path.relative(ROOT, real),
        });
      }
    } else {
      // file exists — verify exact case by reading parent dir
      const real = realCase(target);
      if (real && real !== target) {
        issues.push({
          file: path.relative(ROOT, f),
          ref,
          problem: 'CASE_MISMATCH',
          expected: path.relative(ROOT, real),
        });
      }
    }
  }
}

if (issues.length === 0) {
  console.log(`✓ Path audit OK — ${files.length} HTML files checked, no case/missing issues.`);
  process.exit(0);
} else {
  console.error(`✗ Path audit found ${issues.length} issue(s):`);
  for (const i of issues) {
    if (i.problem === 'MISSING') {
      console.error(`  [MISSING]  ${i.file}  →  ${i.ref}`);
    } else {
      console.error(`  [CASE]     ${i.file}  →  ${i.ref}   (on-disk: ${i.expected})`);
    }
  }
  process.exit(1);
}
