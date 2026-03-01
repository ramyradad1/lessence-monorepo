# Next.js Environment Variable Security Audit

This document details the audit of environment variables used within the `apps/web` Next.js frontend, focusing on ensuring secrets are not leaked to the client browser bundle.

## Overview

In Next.js, any environment variable prefixed with `NEXT_PUBLIC_` is automatically injected into the JavaScript bundle sent to the client's browser. It is critical that API keys, database credentials, and service roles never use this prefix.

## Audit Findings

### 1. Safe Client-Side Variables (No Action Required)
The following variables correctly use `NEXT_PUBLIC_` as they contain public-facing configuration information that the browser requires:
* `NEXT_PUBLIC_SUPABASE_URL`: Required by the Supabase client-side SDK.
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`: A safe, low-privilege JWT explicitly designed for client-side use with PostgreSQL RLS.
* `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`: Another publishable key alias.
* `NEXT_PUBLIC_APP_URL`: Used for SEO routing and basic application location state.
* `NEXT_PUBLIC_DEFAULT_LOCALE`: Used for i18n mapping.

### 2. Secure Server-Side Variables (No Action Required)
The following variables are correctly kept private (no `NEXT_PUBLIC_` prefix) and remain securely inside the Node.js server environment:
* `SUPABASE_SERVICE_ROLE_KEY`: Evaluated during our previous RLS matrix task to be solely server-side.
* `PAYMOB_SECRET_KEY`: Used internally for payment computations.

### 3. ⚠️ Potential Risk: `NEXT_PUBLIC_PAYMOB_API_KEY` Pattern
**Status**: Not found in current codebase
**Variable**: `NEXT_PUBLIC_PAYMOB_API_KEY`

**Analysis:**
No `.env.example` file currently exists in the repository. A previous version may have declared `NEXT_PUBLIC_PAYMOB_API_KEY`. A global `grep` confirms it has not been actively injected into component files. However, if any developer introduces this variable with the `NEXT_PUBLIC_` prefix, it would instantly become publicly visible to anyone who inspects the website's compiled JavaScript. Attackers could extract it and potentially masquerade as the merchant.

Payment initiation and token generation must always happen on the backend (e.g., via Supabase Edge Functions like `create-paymob-order` or Next.js Server Actions), never directly from the browser to the payment provider using the root API key.

## Recommendations

### 1: Create a `.env.example` Template
**Location**: `apps/web/.env.example`
**Action**: Create a documented `.env.example` file listing all required environment variables with placeholder values. Ensure that no secret keys (Paymob API Key, Service Role Key) are prefixed with `NEXT_PUBLIC_`. Mark each variable with a comment indicating whether it is public or secret.

### 2: Migrate Payment Logic to Server Actions
Ensure that whenever Paymob UI integration is built for the Next.js checkout screen, the app calls a Supabase Edge Function (like `create-paymob-order`) rather than interacting with the Paymob API directly from a React Client Component.
