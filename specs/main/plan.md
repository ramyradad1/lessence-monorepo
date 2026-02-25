# Implementation Plan: Perfumes Ecommerce App

**Branch**: `main` | **Date**: 2026-02-24 | **Spec**: [specs/main/spec.md](specs/main/spec.md)
**Input**: Feature specification from `specs/main/spec.md`

## Summary

Build and maintain a multi-platform perfumes ecommerce application (Web + Flutter) using a Supabase backend. Key features include Arabic/English i18n and EGP pricing. All new UI modifications must perfectly preserve and match the existing design system without altering the core structure.

## Technical Context

**Language/Version**: TypeScript (Web), Dart/Flutter (Mobile), SQL/plpgsql (Database)
**Primary Dependencies**: Next.js/React (Web), Flutter (Mobile), Supabase JS/Flutter SDKs
**Storage**: Supabase (PostgreSQL, Edge Functions, Storage Buckets)
**Testing**: Jest (Web), Flutter Test (Mobile)
**Target Platform**: Web Browsers, iOS, Android
**Project Type**: Multi-platform E-commerce App
**Performance Goals**: Fast loading product pages, sub-second add-to-cart, paginated DB queries, no overfetching.
**Constraints**: Must strictly adhere to existing UI Modification Rules. Sensitive logic MUST be Server-Side.
**Scale/Scope**: Unified backend serving 2 distinct client platforms. High concurrency handling via DB constraints and Idempotency keys.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **UI MODIFICATION RULES**: Existing core UI design must be preserved. Any new additions must match existing typography, spacing, colors, and UX patterns. No unrelated UI may be modified.
- **BACKEND (2026 LATEST)**: PostgreSQL-first. Strict RLS. Edge Functions & RPCs for sensitive logic (checkout, payments, inventory, points, coupons). Idempotent operations. Proper DB constraints and Server-Side Validation. No leaked business logic in clients. All prices use EGP formatting. All user text uses i18n keys (AR + EN).

## Project Structure

### Documentation (this feature)

```text
specs/main/
├── plan.md              # This file
├── research.md          # Research on unknown constraints
├── data-model.md        # Entities definition
├── quickstart.md        # Integration/Test scenarios
├── contracts/           # API/Interface specs
└── tasks.md             # Tasks definition
```

### Source Code (repository root)

```text
# Web application
apps/web/
├── src/

# Mobile application
apps/mobile/
├── lib/

# Backend (Supabase)
supabase/
├── functions/
├── migrations/
```

**Structure Decision**: The repository functions as a monorepo containing a web app, a Flutter mobile app, and a Supabase backend project.
