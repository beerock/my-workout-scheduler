/**
 * Database Restore Script
 *
 * Restores a Supabase PostgreSQL database backup using psql.
 *
 * Usage:
 *   npm run restore backups/backup_2025-11-22_14-30-00.sql
 *   npm run restore:full backups/backup_2025-11-22_14-30-00_full.sql
 *
 * Requirements:
 *   - PostgreSQL client tools installed (psql command)
 *   - SUPABASE_DB_PASSWORD environment variable set
 *   - Backup file path as first argument
 *
 * ⚠️ WARNING: This will overwrite existing data in the database!
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { resolve } from 'path'
import * as readline from 'readline'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

// ============================================================================
// Command Line Arguments
// ============================================================================

// Find the backup file (first argument that is not a flag)
const backupFile = process.argv.find(arg =>
  !arg.startsWith('-') &&
  !arg.includes('restore-database.ts') &&
  arg !== process.execPath
)
const includeAuth = process.argv.includes('--include-auth')

// ============================================================================
// Validation
// ============================================================================

if (!backupFile) {
  console.error('❌ Error: No backup file specified')
  console.error('')
  console.error('Usage:')
  console.error('  npm run restore backups/backup_2025-11-22_14-30-00.sql')
  console.error('  npm run restore:full backups/backup_2025-11-22_14-30-00_full.sql')
  console.error('')
  process.exit(1)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD

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

// Resolve backup file path
const backupPath = resolve(process.cwd(), backupFile)

if (!existsSync(backupPath)) {
  console.error(`❌ Error: Backup file not found: ${backupPath}`)
  console.error('')
  console.error('Available backups:')
  try {
    const backups = execSync('ls -1 backups/*.sql 2>/dev/null || echo "No backups found"', {
      encoding: 'utf-8'
    })
    console.error(backups)
  } catch (error) {
    console.error('   No backups directory found')
  }
  process.exit(1)
}

// Extract project reference from Supabase URL
const projectRef = SUPABASE_URL.split('//')[1]?.split('.')[0]
if (!projectRef) {
  console.error('❌ Error: Could not extract project reference from SUPABASE_URL')
  process.exit(1)
}

// Build connection string
const connectionString = `postgresql://postgres:${DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`

// ============================================================================
// Confirmation Prompt
// ============================================================================

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

// ============================================================================
// Restore Process
// ============================================================================

async function restoreDatabase() {
  console.log('⚠️  DATABASE RESTORE')
  console.log('━'.repeat(60))
  console.log(`   Project: ${projectRef}`)
  console.log(`   Mode: ${includeAuth ? 'Full (app data + auth users)' : 'App data only (public schema)'}`)
  console.log(`   Backup: ${backupFile}`)
  console.log('')
  console.log('⚠️  WARNING: This will OVERWRITE existing data!')
  console.log('')

  if (includeAuth) {
    console.log('⚠️  CAUTION: Restoring auth users may cause issues:')
    console.log('   • Existing user sessions will be invalidated')
    console.log('   • May conflict with existing users')
    console.log('   • Refresh tokens may not work')
    console.log('')
  }

  const confirmed = await confirm('Are you sure you want to continue? (y/N): ')

  if (!confirmed) {
    console.log('')
    console.log('❌ Restore cancelled')
    process.exit(0)
  }

  console.log('')
  console.log('🚀 Starting database restore...')
  console.log('')

  try {
    // Check if psql is installed
    try {
      execSync('psql --version', { stdio: 'pipe' })
    } catch (error) {
      console.error('❌ Error: psql is not installed')
      console.error('')
      console.error('Install PostgreSQL client tools:')
      console.error('  • Ubuntu/Debian: sudo apt-get install postgresql-client')
      console.error('  • macOS: brew install postgresql')
      console.error('  • Windows: https://www.postgresql.org/download/windows/')
      process.exit(1)
    }

    // Run psql to restore
    console.log('⏳ Running psql restore...')
    const command = `psql "${connectionString}" < "${backupPath}"`

    execSync(command, {
      stdio: 'inherit',
      env: {
        ...process.env,
        PGPASSWORD: DB_PASSWORD
      }
    })

    console.log('')
    console.log('✅ Restore completed successfully!')
    console.log('')
    console.log('📝 Next steps:')

    if (includeAuth) {
      console.log('   • All users may need to log in again')
      console.log('   • Verify user accounts in Supabase Dashboard → Authentication')
    } else {
      console.log('   • Verify data in Supabase Dashboard → Table Editor')
    }

    console.log('   • Test your application to ensure everything works')
    console.log('')

  } catch (error) {
    console.error('❌ Restore failed!')

    if (error instanceof Error) {
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
      } else if (error.message.includes('permission denied')) {
        console.error('   Error: Permission denied')
        console.error('   The database user may not have permission to restore this data')
        console.error('   Try using Supabase service role or contact support')
      } else {
        console.error(`   Error: ${error.message}`)
      }
    }

    process.exit(1)
  }
}

// Run the restore
restoreDatabase().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
