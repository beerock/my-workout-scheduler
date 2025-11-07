/**
 * Encryption utilities for gym credentials
 * Uses Node.js built-in crypto module for AES-256-GCM encryption
 * Encryption happens in the application layer - key never sent to database
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 16 bytes for AES
const SALT_LENGTH = 64 // 64 bytes for key derivation
const TAG_LENGTH = 16 // 16 bytes for GCM authentication tag
const KEY_LENGTH = 32 // 32 bytes for AES-256
const ITERATIONS = 100000 // PBKDF2 iterations

/**
 * Derives a 32-byte key from the encryption key using PBKDF2
 */
function deriveKey(encryptionKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(encryptionKey, salt, ITERATIONS, KEY_LENGTH, 'sha512')
}

/**
 * Encrypts a password using AES-256-GCM
 * @param password - Plain text password to encrypt
 * @returns Encrypted password (format: salt:iv:tag:encryptedData, all base64)
 */
export function encryptPassword(password: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY

  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)

  // Derive key from encryption key and salt
  const key = deriveKey(encryptionKey, salt)

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  // Encrypt
  let encrypted = cipher.update(password, 'utf8')
  encrypted = Buffer.concat([encrypted, cipher.final()])

  // Get authentication tag
  const tag = cipher.getAuthTag()

  // Combine salt:iv:tag:encryptedData (all base64 encoded)
  return [
    salt.toString('base64'),
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':')
}

/**
 * Decrypts a password using AES-256-GCM
 * @param encryptedPassword - Encrypted password (format: salt:iv:tag:encryptedData)
 * @returns Plain text password
 */
export function decryptPassword(encryptedPassword: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY

  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }

  try {
    // Split the encrypted data
    const parts = encryptedPassword.split(':')
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted password format')
    }

    const [saltBase64, ivBase64, tagBase64, encryptedBase64] = parts

    // Decode from base64
    const salt = Buffer.from(saltBase64, 'base64')
    const iv = Buffer.from(ivBase64, 'base64')
    const tag = Buffer.from(tagBase64, 'base64')
    const encrypted = Buffer.from(encryptedBase64, 'base64')

    // Derive key from encryption key and salt
    const key = deriveKey(encryptionKey, salt)

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    // Decrypt
    let decrypted = decipher.update(encrypted)
    decrypted = Buffer.concat([decrypted, decipher.final()])

    return decrypted.toString('utf8')
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

