#!/usr/bin/env node
/**
 * tsup/esbuild strips top-of-file `"use client"` directives during bundling.
 * Next.js needs them on client-component modules so it routes them correctly.
 *
 * We solve this by prepending `"use client"` to every file in `dist/client/`
 * and `dist/components/` (both .js and .cjs). `dist/server/` and the root
 * `dist/index.*` are untouched — the root entry is server-only on purpose.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const dist = join(here, '..', 'dist')

const DIRECTIVE = '"use client";\n'

/** Directories whose output files should get the directive. */
const CLIENT_DIRS = ['client', 'components']

async function main() {
  for (const dir of CLIENT_DIRS) {
    await annotateDir(join(dist, dir))
  }
  // Chunks can be shared across client & server entries — prepend to any
  // chunk that's imported by a client/components output so Next.js treats
  // it as client. Safe heuristic: only chunks that reference browser APIs
  // or client-only Next.js modules.
  await annotateChunks(dist)
}

async function annotateDir(dir) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (!entry.isFile()) continue
    const ext = extname(entry.name)
    if (ext !== '.js' && ext !== '.cjs') continue
    await annotateFile(join(dir, entry.name))
  }
}

async function annotateChunks(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile()) continue
    if (!/^chunk-.*\.(js|cjs)$/.test(entry.name)) continue
    const path = join(dir, entry.name)
    const contents = await readFile(path, 'utf8')
    // Heuristic: a client chunk references `window.fbq`, `next/script`, or
    // React hooks used only in our client components.
    const isClient =
      contents.includes('window.fbq') ||
      contents.includes('next/script') ||
      contents.includes('next/navigation') ||
      contents.includes('next/router') ||
      contents.includes('fb-page-view')
    if (isClient) await prepend(path, contents)
  }
}

async function annotateFile(path) {
  let contents
  try {
    contents = await readFile(path, 'utf8')
  } catch {
    return
  }
  await prepend(path, contents)
}

async function prepend(path, contents) {
  if (contents.startsWith('"use client"') || contents.startsWith("'use client'")) return
  await writeFile(path, DIRECTIVE + contents)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
