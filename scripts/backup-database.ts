/**
 * Database Backup Script
 *
 * Creates an on-demand backup of the Supabase PostgreSQL database using pg_dump.
 *
 * Usage:
 *   npm run backup
 *
 * Requirements:
 *   - PostgreSQL client tools installed (pg_dump command)
 *   - SUPABASE_DB_PASSWORD environment variable set
 *
 * The backup file will be saved to: backups/backup_YYYYMMDD_HHMMSS.sql
 */

import { execSync } from 'child_process'
import { mkdirSync, existsSync } from 'fs'
import { join } from 'path'

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD

// ============================================================================
// Validation
// ============================================================================

if (!SUPABASE_URL) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL is not set')
  console.error('   Set it in your .env.local file')
  process.exit(1)
}

if (!DB_PASSWORD) {
  console.error('❌ Error: SUPABASE_DB_PASSWORD is not set')
  console.error('')
  console.error('   To get your database password:')
  console.error('   1. Go to Supabase Dashboard → Settings → Database')
  console.error('   2. Scroll to "Database password" section')
  console.error('   3. Click "Reset database password"')
  console.error('   4. Copy the password immediately (only shown once!)')
  console.error('   5. Add to .env.local: SUPABASE_DB_PASSWORD=your_password')
  console.error('')
  process.exit(1)
}

// Extract project reference from Supabase URL
// Format: https://[PROJECT-REF].supabase.co
const projectRef = SUPABASE_URL.split('//')[1]?.split('.')[0]
if (!projectRef) {
  console.error('❌ Error: Could not extract project reference from SUPABASE_URL')
  process.exit(1)
}

// ============================================================================
// Setup
// ============================================================================

// Create backups directory if it doesn't exist
const backupsDir = join(process.cwd(), 'backups')
if (!existsSync(backupsDir)) {
  mkdirSync(backupsDir, { recursive: true })
  console.log('📁 Created backups directory')
}

// Generate timestamp for filename
const timestamp = new Date()
  .toISOString()
  .replace(/T/, '_')
  .replace(/:/g, '-')
  .split('.')[0] // Remove milliseconds
const filename = `backup_${timestamp}.sql`
const filepath = join(backupsDir, filename)

// Build connection string
const connectionString = `postgresql://postgres:${DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`

// ============================================================================
// Backup Process
// ============================================================================

console.log('🚀 Starting database backup...')
console.log(`   Project: ${projectRef}`)
console.log(`   File: ${filename}`)
console.log('')

try {
  // Check if pg_dump is installed
  try {
    execSync('pg_dump --version', { stdio: 'pipe' })
  } catch (error) {
    console.error('❌ Error: pg_dump is not installed')
    console.error('')
    console.error('Install PostgreSQL client tools:')
    console.error('  • Ubuntu/Debian: sudo apt-get install postgresql-client')
    console.error('  • macOS: brew install postgresql')
    console.error('  • Windows: https://www.postgresql.org/download/windows/')
    process.exit(1)
  }

  // Run pg_dump
  console.log('⏳ Running pg_dump...')
  const command = `pg_dump "${connectionString}" > "${filepath}"`

  execSync(command, {
    stdio: 'inherit',
    env: {
      ...process.env,
      PGPASSWORD: DB_PASSWORD // Alternative way to pass password
    }
  })

  // Check if file was created
  if (existsSync(filepath)) {
    const stats = require('fs').statSync(filepath)
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2)

    console.log('')
    console.log('✅ Backup completed successfully!')
    console.log(`   File: ${filepath}`)
    console.log(`   Size: ${fileSizeMB} MB`)
    console.log('')
    console.log('📝 To restore this backup later:')
    console.log(`   psql "postgresql://postgres:[PASSWORD]@db.${projectRef}.supabase.co:5432/postgres" < "${filepath}"`)
  } else {
    console.error('❌ Error: Backup file was not created')
    process.exit(1)
  }

} catch (error) {
  console.error('❌ Backup failed!')

  if (error instanceof Error) {
    // Check for common errors
    if (error.message.includes('password authentication failed')) {
      console.error('   Error: Invalid database password')
      console.error('')
      console.error('   To fix:')
      console.error('   1. Go to Supabase Dashboard → Settings → Database')
      console.error('   2. Click "Reset database password"')
      console.error('   3. Copy the new password')
      console.error('   4. Update SUPABASE_DB_PASSWORD in .env.local')
      console.error('')
    } else if (error.message.includes('could not translate host name')) {
      console.error('   Error: Could not connect to database')
      console.error('   Check your NEXT_PUBLIC_SUPABASE_URL in .env.local')
    } else {
      console.error(`   Error: ${error.message}`)
    }
  }

  process.exit(1)
}
