// Load environment variables from .env.local
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

import { encryptPassword, decryptPassword } from './lib/encryption'

// Test encryption/decryption
const testPassword = 'my-test-password-123'

console.log('Testing encryption...')
console.log('Original password:', testPassword)

try {
  // Encrypt
  const encrypted = encryptPassword(testPassword)
  console.log('Encrypted:', encrypted)
  console.log('Encrypted length:', encrypted.length)

  // Decrypt
  const decrypted = decryptPassword(encrypted)
  console.log('Decrypted:', decrypted)

  // Verify
  if (decrypted === testPassword) {
    console.log('✅ Encryption test PASSED!')
    process.exit(0)
  } else {
    console.log('❌ Encryption test FAILED - passwords do not match')
    process.exit(1)
  }
} catch (error) {
  console.error('❌ Encryption test FAILED:', error)
  process.exit(1)
}

