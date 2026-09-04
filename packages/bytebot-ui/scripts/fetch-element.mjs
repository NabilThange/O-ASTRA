#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uiDir = path.resolve(__dirname, '..');
const targetElementsDir = path.join(uiDir, 'src', 'components', 'ai-elements');
const targetUiDir = path.join(uiDir, 'src', 'components', 'ui');

if (!fs.existsSync(targetElementsDir)) {
  fs.mkdirSync(targetElementsDir, { recursive: true });
}
if (!fs.existsSync(targetUiDir)) {
  fs.mkdirSync(targetUiDir, { recursive: true });
}

function normalizeImports(content) {
  return content
    .replace(/@\/registry\/default\/ui\//g, '@/components/ui/')
    .replace(/@\/registry\/default\/ai-elements\//g, '@/components/ai-elements/');
}

async function fetchShadcnUiDependency(depName) {
  const targetFile = path.join(targetUiDir, `${depName}.tsx`);
  if (fs.existsSync(targetFile)) {
    return;
  }

  const url = `https://ui.shadcn.com/r/styles/new-york/${depName}.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    for (const file of data.files || []) {
      const fileName = path.basename(file.path);
      const filePath = path.join(targetUiDir, fileName);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, normalizeImports(file.content), 'utf8');
        console.log(`  -> Installed missing UI dependency: @/components/ui/${fileName}`);
      }
    }
  } catch (err) {
    console.warn(`  ! Could not auto-fetch UI dependency ${depName}:`, err.message);
  }
}

async function fetchElement(name) {
  console.log(`Fetching component: ${name}...`);
  const url = `https://elements.ai-sdk.dev/api/registry/${name}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Failed to fetch '${name}': HTTP ${res.status}`);
      return false;
    }
    const data = await res.json();

    // Fetch registry dependencies if any
    if (Array.isArray(data.registryDependencies)) {
      for (const dep of data.registryDependencies) {
        await fetchShadcnUiDependency(dep);
      }
    }

    // Save component files
    for (const file of (data.files || [])) {
      const fileName = path.basename(file.path);
      const destPath = path.join(targetElementsDir, fileName);
      const modifiedContent = normalizeImports(file.content);
      fs.writeFileSync(destPath, modifiedContent, 'utf8');
      console.log(`  ✓ Saved ${fileName} to src/components/ai-elements/${fileName}`);
    }

    if (data.dependencies?.length) {
      console.log(`  ℹ Required packages: ${data.dependencies.join(', ')}`);
    }
    return true;
  } catch (err) {
    console.error(`Error fetching '${name}':`, err.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(`
Usage:
  node scripts/fetch-element.mjs <component-name> [<component-name-2> ...]
  node scripts/fetch-element.mjs --all

Examples:
  node scripts/fetch-element.mjs attachments
  node scripts/fetch-element.mjs reasoning tool task
`);
    process.exit(0);
  }

  if (args.includes('--all')) {
    const sitemapRes = await fetch('https://elements.ai-sdk.dev/sitemap.xml');
    const text = await sitemapRes.text();
    const all = [...new Set([...text.matchAll(/components\/([a-zA-Z0-9_-]+)/g)].map(m => m[1]))];
    console.log(`Discovered ${all.length} components from elements.ai-sdk.dev`);
    for (const item of all) {
      await fetchElement(item);
    }
  } else {
    for (const name of args) {
      await fetchElement(name);
    }
  }
}

main();
