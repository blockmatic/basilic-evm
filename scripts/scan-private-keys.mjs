#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { exit } from 'node:process'

// Define patterns for Ethereum and Solana private keys
const ETH_PATTERN = /(0x)?[A-Fa-f0-9]{64}/
const SOL_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{88}$/

// File extensions to check
const EXTENSIONS = /\.(js|ts|sol|py|sh|txt|json)$/

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return output
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter(line => EXTENSIONS.test(line))
  } catch {
    return []
  }
}

function checkFileForPrivateKeys(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Check for Ethereum private key pattern
      if (ETH_PATTERN.test(line)) {
        return { found: true, line: i + 1, type: 'Ethereum' }
      }

      // Check for Solana private key pattern (check each word)
      const words = line.split(/[\s"'`,;:=\[\]{}()]+/)
      for (const word of words) {
        if (SOL_PATTERN.test(word)) {
          return { found: true, line: i + 1, type: 'Solana' }
        }
      }
    }

    return { found: false }
  } catch {
    return { found: false }
  }
}

const files = getStagedFiles()

if (files.length === 0) {
  exit(0)
}

const detectedFiles = []

for (const file of files) {
  const result = checkFileForPrivateKeys(file)
  if (result.found) {
    detectedFiles.push({ file, ...result })
  }
}

if (detectedFiles.length > 0) {
  console.error('\n❌ Error: Detected potential private keys in staged files\n')
  for (const { file, line, type } of detectedFiles) {
    console.error(`  - ${file}:${line} (${type} private key pattern)`)
  }
  console.error('\nPlease remove private keys before committing.')
  console.error('If this is a false positive, consider adding an allowlist.\n')
  exit(1)
}

exit(0)
