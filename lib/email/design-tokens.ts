/**
 * Email Design System - Design Tokens
 *
 * Centralized design tokens for consistent email styling across all templates.
 * All email templates should import and use these tokens.
 *
 * Benefits:
 * - Consistent branding across all emails
 * - Easy to update design (change once, updates everywhere)
 * - Type-safe design values
 */

export const emailDesign = {
  colors: {
    primary: '#2563eb',      // Blue (links, CTAs)
    success: '#10b981',      // Green (confirmed, success states)
    warning: '#f59e0b',      // Orange (retry, waitlist)
    error: '#ef4444',        // Red (critical failures)
    neutral: '#6b7280',      // Gray (body text)
    neutralLight: '#9ca3af', // Light gray (secondary text)
    background: '#ffffff',   // White (email background)
    backgroundAlt: '#f9fafb', // Light gray (sections)
  },
  fonts: {
    heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'Menlo, Monaco, "Courier New", monospace',
  },
  fontSize: {
    h1: '24px',
    h2: '20px',
    h3: '18px',
    body: '16px',
    small: '14px',
    tiny: '12px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: '6px',
  maxWidth: '600px', // Email max width for optimal readability
} as const;

export type EmailSeverity = 'success' | 'warning' | 'error' | 'info';

/**
 * Escape HTML special characters to prevent HTML injection in email templates.
 * SECURITY: Always use this for any user-controlled content in emails.
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
