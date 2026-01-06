/**
 * Environment Configuration Test Script
 *
 * Tests that all environment utilities work correctly without exposing sensitive values
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
config({ path: '.env.local' })

import {
  getSiteUrl,
  getEmailConfig,
  getEnvironment,
  isProduction,
  isDevelopment,
  isPreview,
  getResendApiKey,
  validateEnv
} from './lib/env-utils'

console.log('='.repeat(80))
console.log('Environment Configuration Test')
console.log('='.repeat(80))
console.log()

// Test 1: Environment Detection
console.log('1. Environment Detection')
console.log('-'.repeat(80))
console.log(`   Current environment: ${getEnvironment()}`)
console.log(`   Is production: ${isProduction()}`)
console.log(`   Is development: ${isDevelopment()}`)
console.log(`   Is preview: ${isPreview()}`)
console.log()

// Test 2: Site URL Resolution
console.log('2. Site URL Resolution')
console.log('-'.repeat(80))
try {
  const siteUrl = getSiteUrl()
  console.log(`   ✓ Site URL resolved: ${siteUrl}`)
} catch (error) {
  console.error(`   ✗ Failed to get site URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
}
console.log()

// Test 3: Email Configuration
console.log('3. Email Configuration')
console.log('-'.repeat(80))
try {
  const { fromEmail, fromName } = getEmailConfig()
  console.log(`   ✓ From email: ${fromEmail}`)
  console.log(`   ✓ From name: ${fromName}`)
} catch (error) {
  console.error(`   ✗ Failed to get email config: ${error instanceof Error ? error.message : 'Unknown error'}`)
}
console.log()

// Test 4: Resend API Key (without exposing the value)
console.log('4. Resend API Key')
console.log('-'.repeat(80))
try {
  const apiKey = getResendApiKey()
  const maskedKey = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4)
  console.log(`   ✓ Resend API key configured: ${maskedKey}`)
  console.log(`   ✓ Key length: ${apiKey.length} characters`)
  console.log(`   ✓ Starts with 're_': ${apiKey.startsWith('re_')}`)
} catch (error) {
  console.error(`   ✗ Resend API key error: ${error instanceof Error ? error.message : 'Unknown error'}`)
}
console.log()

// Test 5: Environment Validation
console.log('5. Environment Validation')
console.log('-'.repeat(80))
try {
  const validation = validateEnv()

  if (validation.isValid) {
    console.log(`   ✓ All required environment variables are set`)
    console.log(`   ✓ Environment: ${validation.environment}`)
    console.log(`   ✓ Site URL: ${validation.siteUrl}`)
  } else {
    console.error(`   ✗ Missing required environment variables:`)
    validation.missing.forEach(key => {
      console.error(`      - ${key}`)
    })
  }
} catch (error) {
  console.error(`   ✗ Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
}
console.log()

// Test 6: Individual Environment Variables (masked)
console.log('6. Individual Environment Variables (masked for security)')
console.log('-'.repeat(80))

const envVars = [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, sensitive: true },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', value: process.env.SUPABASE_SERVICE_ROLE_KEY, sensitive: true },
  { name: 'ENCRYPTION_KEY', value: process.env.ENCRYPTION_KEY, sensitive: true },
  { name: 'INNGEST_EVENT_KEY', value: process.env.INNGEST_EVENT_KEY, sensitive: true },
  { name: 'INNGEST_SIGNING_KEY', value: process.env.INNGEST_SIGNING_KEY, sensitive: true },
  { name: 'RESEND_API_KEY', value: process.env.RESEND_API_KEY, sensitive: true },
  { name: 'RESEND_FROM_EMAIL', value: process.env.RESEND_FROM_EMAIL },
  { name: 'RESEND_FROM_NAME', value: process.env.RESEND_FROM_NAME },
  { name: 'GITHUB_APP_ID', value: process.env.GITHUB_APP_ID },
  { name: 'GITHUB_APP_INSTALLATION_ID', value: process.env.GITHUB_APP_INSTALLATION_ID },
  { name: 'GITHUB_APP_PRIVATE_KEY', value: process.env.GITHUB_APP_PRIVATE_KEY, sensitive: true },
  { name: 'GITHUB_REPOSITORY', value: process.env.GITHUB_REPOSITORY },
]

envVars.forEach(({ name, value, sensitive }) => {
  if (value) {
    if (sensitive) {
      // Mask sensitive values
      const masked = value.length > 8
        ? value.substring(0, 4) + '***' + value.substring(value.length - 4)
        : '***'
      console.log(`   ✓ ${name}: ${masked} (${value.length} chars)`)
    } else {
      // Show non-sensitive values
      console.log(`   ✓ ${name}: ${value}`)
    }
  } else {
    console.log(`   ✗ ${name}: NOT SET`)
  }
})

console.log()
console.log('='.repeat(80))
console.log('Test Complete!')
console.log('='.repeat(80))
