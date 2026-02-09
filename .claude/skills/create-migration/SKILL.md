---
name: create-migration
description: Scaffold a new Supabase migration with auto-numbered filename and header template
user-invocable: true
disable-model-invocation: true
arguments:
  - name: name
    description: Short snake_case name for the migration (e.g. "add_user_preferences")
    required: true
---

# Create Migration

Create a new Supabase SQL migration file following project conventions.

## Steps

1. **Detect next migration number**: List files in `supabase/migrations/` and find the highest `NNN_` prefix. Increment by 1, zero-padded to 3 digits.

2. **Create the migration file** at `supabase/migrations/{number}_{name}.sql` with this template:

```sql
-- Migration: {Title Case of name}
-- Created: {YYYY-MM-DD}
-- Description: TODO - describe what this migration does
--

-- =============================================================================
-- 1. TODO - First change
-- =============================================================================


```

3. **Remind the user** of the required workflow after creating the file:

> Migration created. Remember the database change workflow:
> 1. **Migration** (done) → `supabase/migrations/{filename}`
> 2. **Types** → Update `lib/database.types.ts`
> 3. **Server actions** → Update `app/actions/`
> 4. **Components** → Update UI as needed
