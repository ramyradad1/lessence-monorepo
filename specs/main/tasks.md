# Tasks: Perfumes Ecommerce App

**Input**: Design documents from `/specs/main/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Verify Supabase project and local linked status
- [ ] T002 Verify Next.js web app structure in `apps/web`
- [ ] T003 Verify Flutter mobile app structure in `apps/mobile`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T004 Setup database schema (`products`, `orders`) in Supabase (with strict Postgres typing + Constraints)
- [x] T005 Setup RLS policies for all tables (Select/Insert rules)
- [ ] T006 [P] Setup Supabase client in Web app
- [ ] T007 [P] Setup Supabase client in Mobile app

---

## Phase 3: User Story 1 - Multi-platform Shopping (Priority: P1) 🎯 MVP

**Goal**: Users can browse and purchase perfumes on both the web application and the Flutter mobile app.

**Independent Test**: Can be fully tested by launching the web app or mobile app, browsing products, adding to cart, and checking out.

### Implementation for User Story 1

- [ ] T012 [P] [US1] Implement Product models in Web and Mobile
- [ ] T013 [P] [US1] Create Product listing UI in Web (All text via i18n keys)
- [ ] T014 [P] [US1] Create Product listing UI in Mobile (All text via i18n keys)
- [x] T015 [US1] Implement Edge Function for Checkout/Order Creation (Server-side idempotency)
- [ ] T016 [US1] Implement Add to Cart and Checkout logic in Web interacting with Edge Function
- [ ] T017 [US1] Implement Add to Cart and Checkout logic in Mobile interacting with Edge Function

---

## Phase 4: User Story 2 - Bilingual Support (Priority: P1)

**Goal**: Users can view the application in either Arabic or English.

**Independent Test**: Can be tested by toggling the language selector and observing UI text and content updates.

### Implementation for User Story 2

- [ ] T018 [P] [US2] Setup i18n configuration in Web (Keys + Trans)
- [ ] T019 [P] [US2] Setup localization in Mobile (Keys + Trans)
- [ ] T020 [US2] Implement language toggle UI in Web
- [ ] T021 [US2] Implement language toggle UI in Mobile

---

## Phase 5: User Story 3 - UI Extensions for New Features (Priority: P2)

**Goal**: When new features are added, their UI components seamlessly blend with the existing design system.

**Independent Test**: Can be tested visually against the established design tokens and components when a new feature is deployed.

### Implementation for User Story 3

- [ ] T022 [P] [US3] Document existing CSS/Design tokens to establish strict matching rules
- [ ] T023 [US3] Review implemented Web UI against UI modification rules
- [ ] T024 [US3] Review implemented Mobile UI against UI modification rules

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T025 Confirm Edge Functions and RPC queries are fast via Supabase Logs (No SELECT *)
- [ ] T026 Perform end-to-end testing of the full checkout flow in both languages
- [ ] T027 Confirm all prices display correctly in EGP using shared formatter
- [ ] T028 Audit RLS policies check for any open holes
- [ ] T029 Check for any remaining hardcoded strings in UI - move to i18n keys
- [ ] T030 Ensure "What was implemented", "Files updated", "What remains" block at end of task.
