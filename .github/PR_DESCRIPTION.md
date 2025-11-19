## Summary

This PR adds four new feature specifications to the backlog documentation, including one post-MVP enhancement and three critical pre-MVP requirements that block MVP launch.

## Features Added

### 1. "Stay Logged In" Checkbox on Login Page
**Status:** Backlogged
**Priority:** Medium (UX improvement)

- Add user control over session persistence
- Default: unchecked (session ends when browser closes)
- Checked: session persists indefinitely
- Only on login page (not signup)
- Label: "Keep me logged in"

### 2. OAuth Login (Google and Apple Sign-In)
**Status:** Backlogged
**Priority:** High (major UX improvement, preferred login method)

- Google and Apple OAuth as **preferred login method**
- Unified login/signup experience
- Account linking in both directions (OAuth ↔ password)
- Profile management: Connected Accounts section
- Pull email, name, and profile photo from OAuth providers
- Skip email verification for OAuth users
- Must maintain at least one login method (can't disconnect last one)

### 3. Password Security Requirements ⚠️
**Status:** Pre-MVP - **BLOCKS MVP LAUNCH**
**Priority:** High (security requirement)

- **Requirements:** 8 chars minimum + lowercase + uppercase + digits (no symbols required)
- **Enforcement:** App-level validation only (client + server)
- **UI:** Real-time feedback with checkmarks
- **Migration:** Force password reset for existing users with weak passwords on next login
- **Future:** Password strength meter (post-MVP)

### 4. Contact/Support Form ⚠️
**Status:** Pre-MVP - **BLOCKS MVP LAUNCH**
**Priority:** High (user support and trust)

- **Contact page:** Dedicated `/contact` page with form
- **Form fields:** Name, Email, Subject dropdown, Message (pre-filled if logged in)
- **Email:** Sends to `help@beerock.com` via Resend
- **Footer:** Add "Contact" link throughout site
- **Confirmation:** On-page success message (no email confirmation for MVP)
- **Email setup:** Use existing beerock.com domain (same as noreply@)

## Documentation Changes

**File Modified:**
- `docs/BACKLOG.md` (+1,614 lines)

**Commits:**
- `f811a17` - docs: add 'Stay Logged In' checkbox feature to backlog
- `2e31c6c` - docs: add OAuth login (Google/Apple) feature to backlog
- `8f5d0a6` - docs: add password security requirements to backlog (pre-MVP)
- `5bbebcb` - docs: add contact/support form to backlog (pre-MVP)

**Detailed Specifications Include:**
- Complete requirements and user stories
- Implementation notes with code examples
- UI/UX mockups and designs
- Comprehensive testing checklists
- Security considerations
- Database schema changes (where applicable)
- Code location references
- Alternative enhancements for future consideration

## Why These Features?

**Stay Logged In:**
- Users expect control over session persistence
- Security consideration for shared computers
- Industry-standard login feature

**OAuth Login:**
- Reduces friction for new users (no password to remember)
- Better security (leverages Google/Apple auth)
- Modern authentication standard
- Increases conversion rates

**Password Security:**
- Currently only 8 char minimum with no complexity
- Protects sensitive data (encrypted gym credentials, booking history)
- Industry best practice even for casual sites
- **Must be completed before MVP launch**

**Contact/Support Form:**
- Users need a way to get help and report issues
- Builds trust and professionalism
- Required for legal/compliance (contact info)
- Critical support channel for user retention
- **Must be completed before MVP launch**

## Pre-MVP Requirements Summary

These features **BLOCK MVP LAUNCH** and must be completed:

1. ✅ **Password Security Requirements** - Enforce password complexity
2. ✅ **Contact/Support Form** - Allow users to reach out for help

## Next Steps

After this PR is merged:
1. **Pre-MVP (blocks launch):** Implement password security requirements
2. **Pre-MVP (blocks launch):** Implement contact/support form
3. **Post-MVP:** Consider OAuth implementation (high priority for UX)
4. **Post-MVP:** Implement "Stay Logged In" checkbox (medium priority)

## Related Issues

None - this is documentation/planning work to capture feature requirements for future implementation.

---

**Review Notes:** This PR only adds documentation to the backlog. No code changes or implementation work is included.
