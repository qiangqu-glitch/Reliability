#!/usr/bin/env node
/**
 * ReliToolbox production build / obfuscation script
 *
 * Purpose: produce a `dist/` mirror with:
 *   1. All .js comments stripped (line + block, string-safe)
 *   2. All inline <script> blocks inside .html minified
 *   3. All whitespace collapsed, newlines normalized
 *   4. Copyright banner injected at top of every output file
 *
 * NOT a substitute for real DRM — this is a deterrent against casual
 * download-and-republish. The algorithms remain computationally present
 * because the browser must execute them.
 *
 * Usage:
 *   node build/obfuscate.js            # produces ./dist
 *   node build/obfuscate.js --out ../dist-prod
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const outIdx = argv.indexOf('--out');
const OUT = outIdx >= 0 ? path.resolve(argv[outIdx + 1]) : path.join(ROOT, 'dist');

const BANNER_JS = '/*! ReliToolbox | reliability.chemcalc.cn | Copyright (c) All rights reserved. Unauthorized reproduction, decompilation, reverse engineering or redistribution is prohibited. Contact: CHEMCALC@outlook.com */';
const BANNER_HTML = '<!-- ReliToolbox | reliability.chemcalc.cn | Copyright (c) All rights reserved. Unauthorized reproduction, decompilation, reverse engineering or redistribution is prohibited. Contact: CHEMCALC@outlook.com -->';

// String-safe JS comment+whitespace stripper (single-pass state machine)
function minifyJS(src) {
  let out = '';
  let i = 0, n = src.length;
  let state = 'code'; // code | sl_comment | bl_comment | sq | dq | tpl | regex
  let prevNonWs = ''; // last non-whitespace emitted — needed for regex detection
  while (i < n) {
    const c = src[i], d = src[i + 1] || '';
    if (state === 'code') {
      if (c === '/' && d === '/') { state = 'sl_comment'; i += 2; continue; }
      if (c === '/' && d === '*') { state = 'bl_comment'; i += 2; continue; }
      if (c === '"') { state = 'dq'; out += c; i++; continue; }
      if (c === "'") { state = 'sq'; out += c; i++; continue; }
      if (c === '`') { state = 'tpl'; out += c; i++; continue; }
      // regex literal heuristic: / after operator or keyword start
      if (c === '/' && /[=(,;:!&|?{}\n\[+\-*%^~<>]/.test(prevNonWs || '(')) {
        state = 'regex'; out += c; i++; continue;
      }
      // whitespace collapse
      if (c === '\n' || c === '\r' || c === '\t' || c === ' ') {
        // keep exactly one space between identifier/number tokens
        const last = out[out.length - 1] || '';
        const nextNonWs = (() => { let k = i; while (k < n && /\s/.test(src[k])) k++; return src[k] || ''; })();
        if (/[A-Za-z0-9_$]/.test(last) && /[A-Za-z0-9_$]/.test(nextNonWs)) out += ' ';
        i++; continue;
      }
      out += c; prevNonWs = c; i++; continue;
    }
    if (state === 'sl_comment') {
      if (c === '\n') { state = 'code'; }
      i++; continue;
    }
    if (state === 'bl_comment') {
      if (c === '*' && d === '/') { state = 'code'; i += 2; continue; }
      i++; continue;
    }
    if (state === 'sq') {
      out += c; if (c === '\\' && d) { out += d; i += 2; continue; }
      if (c === "'") state = 'code';
      i++; continue;
    }
    if (state === 'dq') {
      out += c; if (c === '\\' && d) { out += d; i += 2; continue; }
      if (c === '"') state = 'code';
      i++; continue;
    }
    if (state === 'tpl') {
      out += c; if (c === '\\' && d) { out += d; i += 2; continue; }
      if (c === '`') state = 'code';
      i++; continue;
    }
    if (state === 'regex') {
      out += c; if (c === '\\' && d) { out += d; i += 2; continue; }
      if (c === '/') state = 'code';
      i++; continue;
    }
  }
  return out.replace(/ ?\n ?/g, '\n').replace(/\n+/g, '\n').trim();
}

// HTML: minify contents of every <script>...</script> that isn't src-referenced
function minifyHTML(src) {
  return src.replace(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g, (m, attrs, body) => {
    if (!body.trim()) return m;
    try {
      return '<script' + attrs + '>' + minifyJS(body) + '</script>';
    } catch (e) {
      return m; // leave untouched on error
    }
  });
}

function walk(dir, cb) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['dist', 'build', 'tests', 'node_modules', '.git'].includes(entry.name)) continue;
      walk(full, cb);
    } else {
      cb(full);
    }
  }
}

function copyAndProcess(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  const ext = path.extname(src).toLowerCase();
  if (ext === '.js') {
    const body = fs.readFileSync(src, 'utf8');
    fs.writeFileSync(dst, BANNER_JS + '\n' + minifyJS(body));
  } else if (ext === '.html') {
    const body = fs.readFileSync(src, 'utf8');
    const minified = minifyHTML(body);
    // inject banner right after <!DOCTYPE ...>
    const withBanner = minified.replace(/(<!DOCTYPE[^>]*>)/i, '$1\n' + BANNER_HTML);
    fs.writeFileSync(dst, withBanner);
  } else {
    fs.copyFileSync(src, dst);
  }
}

// --- Run ---
if (fs.existsSync(OUT)) {
  for (const f of fs.readdirSync(OUT)) fs.rmSync(path.join(OUT, f), { recursive: true, force: true });
} else {
  fs.mkdirSync(OUT, { recursive: true });
}

let nJS = 0, nHTML = 0, nOther = 0;
walk(ROOT, (src) => {
  const rel = path.relative(ROOT, src);
  // skip markdown / dotfiles / sensitive
  if (/\.(md|log|bak)$/i.test(rel)) return;
  if (rel.startsWith('.')) return;
  const dst = path.join(OUT, rel);
  copyAndProcess(src, dst);
  if (src.endsWith('.js')) nJS++;
  else if (src.endsWith('.html')) nHTML++;
  else nOther++;
});

console.log(`ReliToolbox production build complete → ${OUT}`);
console.log(`  JS minified  : ${nJS}`);
console.log(`  HTML minified: ${nHTML}`);
console.log(`  Other copied : ${nOther}`);
