/**
 * Resend Email Test Script
 *
 * Sends a test email to verify Resend integration is working correctly
 *
 * Usage: npx tsx test-resend-email.ts your@email.com
 */

// Load environment variables from .env.local
import { config } from 'dotenv'
config({ path: '.env.local' })

import { Resend } from 'resend'
import { getResendApiKey, getEmailConfig, getSiteUrl } from './lib/env-utils'

// Get recipient email from command line argument
const recipientEmail = process.argv[2]

if (!recipientEmail) {
  console.error('❌ Error: Please provide a recipient email address')
  console.log('\nUsage: npx tsx test-resend-email.ts your@email.com')
  process.exit(1)
}

// Email validation (basic)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(recipientEmail)) {
  console.error('❌ Error: Invalid email address format')
  process.exit(1)
}

console.log('='.repeat(80))
console.log('Resend Email Test')
console.log('='.repeat(80))
console.log()

async function sendTestEmail() {
  try {
    // Get configuration
    const apiKey = getResendApiKey()
    const { fromEmail, fromName } = getEmailConfig()
    const siteUrl = getSiteUrl()

    console.log('📧 Email Configuration:')
    console.log(`   From: ${fromName} <${fromEmail}>`)
    console.log(`   To: ${recipientEmail}`)
    console.log(`   Site URL: ${siteUrl}`)
    console.log()

    // Initialize Resend
    const resend = new Resend(apiKey)

    console.log('📤 Sending test email...')
    console.log()

    // Send email
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: recipientEmail,
      subject: 'Test Email from My Workout Scheduler',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 8px 8px 0 0;
                text-align: center;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-top: none;
                border-radius: 0 0 8px 8px;
              }
              .success {
                background: #d1fae5;
                border: 1px solid #6ee7b7;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
              }
              .info {
                background: white;
                border: 1px solid #e5e7eb;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
              }
              a {
                color: #667eea;
                text-decoration: none;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0;">🎉 Resend Integration Test</h1>
            </div>
            <div class="content">
              <div class="success">
                <strong>✅ Success!</strong> Your Resend integration is working correctly.
              </div>

              <p>Hi there!</p>

              <p>This is a test email from <strong>My Workout Scheduler</strong> to verify that the Resend email service is configured properly.</p>

              <div class="info">
                <h3 style="margin-top: 0;">Configuration Details:</h3>
                <ul style="margin-bottom: 0;">
                  <li><strong>Sender:</strong> ${fromName} &lt;${fromEmail}&gt;</li>
                  <li><strong>Environment:</strong> Development</li>
                  <li><strong>Site URL:</strong> ${siteUrl}</li>
                  <li><strong>Email Service:</strong> Resend</li>
                </ul>
              </div>

              <h3>What's Next?</h3>
              <p>Now that Resend is working, you can:</p>
              <ul>
                <li>Implement booking confirmation emails</li>
                <li>Set up booking failure notifications</li>
                <li>Configure Supabase auth emails via Resend SMTP</li>
                <li>Add Resend API key to Vercel for production deployments</li>
              </ul>

              <p>If you received this email, everything is working perfectly! 🚀</p>

              <div class="footer">
                <p>Sent from My Workout Scheduler<br>
                <a href="${siteUrl}">${siteUrl}</a></p>
                <p style="margin-top: 10px; font-size: 12px;">
                  This is a test email. You can safely delete it.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('❌ Failed to send email:')
      console.error(error)
      process.exit(1)
    }

    console.log('✅ Email sent successfully!')
    console.log()
    console.log('📨 Email Details:')
    console.log(`   ID: ${data?.id}`)
    console.log()
    console.log('💡 Next Steps:')
    console.log('   1. Check your inbox (and spam folder) for the test email')
    console.log('   2. If received, Resend is fully configured and working!')
    console.log('   3. Ready to implement booking notification emails')
    console.log()
    console.log('='.repeat(80))
  } catch (error) {
    console.error('❌ Unexpected error:')
    console.error(error)
    process.exit(1)
  }
}

// Run the test
sendTestEmail()
