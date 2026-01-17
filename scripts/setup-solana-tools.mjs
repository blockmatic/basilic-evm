#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { platform } from 'node:os'
import { exit } from 'node:process'

const TOOL = {
  name: 'Anchor',
  command: 'anchor',
  checkCommand: 'anchor --version',
  required: false,
  macos: {
    brew: 'brew install anchor-lang/anchor/anchor',
    manual: 'avm install latest && avm use latest',
    instructions: 'https://www.anchor-lang.com/docs/installation',
  },
  linux: {
    manual:
      'cargo install --git https://github.com/coral-xyz/anchor avm --locked --force && avm install latest && avm use latest',
    instructions: 'https://www.anchor-lang.com/docs/installation',
  },
  win32: {
    chocolatey: 'choco install anchor',
    scoop: 'scoop install anchor',
    manual: 'https://www.anchor-lang.com/docs/installation',
    instructions: 'https://www.anchor-lang.com/docs/installation',
  },
}

function checkToolExists(toolName, checkCommand) {
  try {
    execSync(checkCommand, { stdio: 'ignore' })
    return true
  } catch {
    try {
      execSync(`which ${toolName}`, { stdio: 'ignore' })
      return true
    } catch {
      try {
        execSync(`where ${toolName}`, { stdio: 'ignore' })
        return true
      } catch {
        return false
      }
    }
  }
}

function getPlatform() {
  const osPlatform = platform()
  if (osPlatform === 'darwin') return 'macos'
  if (osPlatform === 'linux') return 'linux'
  if (osPlatform === 'win32') return 'win32'
  return 'linux'
}

function checkBrewAvailable() {
  try {
    execSync('which brew', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function checkCargoAvailable() {
  try {
    execSync('which cargo', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function installTool() {
  const os = getPlatform()
  const instructions = TOOL[os]
  const displayName = TOOL.name

  if (!instructions) {
    console.error(`\n⚠️  Cannot install ${displayName} on ${os}`)
    console.error(
      `Please install ${displayName} manually: ${instructions?.instructions || 'See documentation'}`,
    )
    return false
  }

  // macOS: Try brew first if available
  if (os === 'macos' && instructions.brew && checkBrewAvailable()) {
    try {
      console.log(`\n📦 Installing ${displayName} via Homebrew...`)
      execSync(instructions.brew, { stdio: 'inherit' })
      if (checkToolExists(TOOL.command, TOOL.checkCommand)) {
        console.log(`✅ ${displayName} installed successfully`)
        return true
      }
    } catch (error) {
      console.error(`\n⚠️  Homebrew installation failed: ${error.message}`)
      console.error(`Trying manual method...`)
    }
  }

  // Anchor: Use avm (requires cargo for Linux)
  if (instructions.manual) {
    if (os === 'linux' && !checkCargoAvailable()) {
      console.error(`\n⚠️  Rust/Cargo is required to install Anchor on Linux`)
      console.error(
        `   Please install Rust first: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`,
      )
      console.error(`   Then run: ${instructions.manual}`)
      return false
    }

    try {
      console.log(`\n📦 Installing ${displayName} via avm...`)

      // Check if avm is already installed
      let avmInstalled = false
      try {
        execSync('avm --version', { stdio: 'ignore' })
        avmInstalled = true
      } catch {
        // avm not installed, need to install it first (Linux only)
        if (os === 'linux') {
          console.log(`   Installing avm...`)
          execSync(instructions.manual.split(' && ')[0], { stdio: 'inherit' })
          avmInstalled = true
        }
      }

      if (avmInstalled || os === 'macos') {
        // Install and use latest Anchor
        console.log(`   Installing latest Anchor version...`)
        execSync('avm install latest', { stdio: 'inherit' })
        execSync('avm use latest', { stdio: 'inherit' })

        if (checkToolExists(TOOL.command, TOOL.checkCommand)) {
          console.log(`✅ ${displayName} installed successfully`)
          return true
        }
      }
    } catch (error) {
      console.error(`\n⚠️  avm installation failed: ${error.message}`)
    }
  }

  // Windows: Print instructions (can't auto-install without admin)
  if (os === 'win32') {
    console.error(`\n⚠️  ${displayName} is not installed.`)
    console.error(`\nTo install ${displayName} on Windows:`)
    if (instructions.chocolatey) {
      console.error(`  ${instructions.chocolatey}`)
    }
    if (instructions.scoop) {
      console.error(`  ${instructions.scoop}`)
    }
    if (instructions.manual) {
      console.error(`\nOr manually: ${instructions.manual}`)
    }
    if (instructions.instructions) {
      console.error(`\nFor more options, see: ${instructions.instructions}`)
    }
    return false
  }

  // Fallback: Print manual instructions
  if (instructions.manual) {
    console.error(`\n⚠️  Automatic installation failed. Please install manually:`)
    console.error(`   ${instructions.manual}`)
    if (instructions.instructions) {
      console.error(`\n   Documentation: ${instructions.instructions}`)
    }
  }

  return false
}

function main() {
  console.log('\n🔨 Setting up Solana contract development tools (Anchor)...\n')

  const isRequired = TOOL.required
  const displayName = TOOL.name

  if (checkToolExists(TOOL.command, TOOL.checkCommand)) {
    try {
      const version = execSync(TOOL.checkCommand, { encoding: 'utf-8' }).trim()
      console.log(`✅ ${displayName} is already installed (${version})`)
    } catch {
      console.log(`✅ ${displayName} is already installed`)
    }
    console.log('\n✅ Solana tools setup complete!\n')
    exit(0)
  }

  console.log(`📥 ${displayName} is not installed${isRequired ? ' (required)' : ' (optional)'}`)

  const installed = installTool()

  if (installed) {
    console.log('\n✅ Solana tools setup complete!\n')
    exit(0)
  } else {
    if (isRequired) {
      console.error(`\n❌ ${displayName} is required but installation failed`)
      console.error('Please install Anchor manually and try again.\n')
      exit(1)
    } else {
      console.log(`\n⚠️  ${displayName} installation skipped (optional)`)
      console.log('   Solana contracts will skip building if Anchor is not available')
      console.log('\n✅ Solana tools setup complete!\n')
      exit(0)
    }
  }
}

main()
