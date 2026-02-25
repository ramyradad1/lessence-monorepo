# Feature Specification: Perfumes Ecommerce App

**Feature Branch**: `main`
**Created**: 2026-02-24
**Status**: Draft
**Input**: The project is a perfumes ecommerce app with web and Flutter mobile clients, Supabase backend, Arabic/English i18n, and EGP pricing. UI MODIFICATION RULES: Preserve existing core UI design. Do not redesign, restyle, or restructure current core screens. Only add/extend UI for NEW features matching existing design system (spacing, typography, colors, UX patterns). Keep additions minimal and consistent.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-platform Shopping (Priority: P1)

Users can browse and purchase perfumes on both the web application and the Flutter mobile app.

**Why this priority**: Core business value; shopping across platforms is the fundamental purpose of the app.

**Independent Test**: Can be tested by launching the web app or mobile app, browsing products, adding to cart, and checking out.

**Acceptance Scenarios**:

1. **Given** a user is on the home page, **When** they browse products, **Then** they see perfumes with titles, descriptions, and EGP pricing.
2. **Given** a user is on a product page, **When** they add it to the cart and checkout, **Then** a clear order is created in the Supabase backend.

---

### User Story 2 - Bilingual Support (Priority: P1)

Users can view the application in either Arabic or English.

**Why this priority**: Crucial for the target demographic and accessibility.

**Independent Test**: Can be tested by toggling the language selector and observing UI text and content updates.

**Acceptance Scenarios**:

1. **Given** the app is in English, **When** the user switches to Arabic, **Then** the UI RTL layout and Arabic translations are applied.
2. **Given** the app is in Arabic, **When** the user switches to English, **Then** the UI LTR layout and English translations are applied.

---

### User Story 3 - UI Extensions for New Features (Priority: P2)

When new features are added, their UI components seamlessly blend with the existing design system.

**Why this priority**: Ensures a consistent and premium user experience without breaking the existing core design. 

**Independent Test**: Can be tested visually against the established design tokens and components when a new feature is deployed.

**Acceptance Scenarios**:

1. **Given** a new UI component is added, **When** it is rendered, **Then** it uses identical spacing, typography, colors, and UX patterns to the existing app.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support web (React/Next.js/etc.) and mobile (Flutter) clients.
- **FR-002**: System MUST use Supabase as the unified backend for data and authentication.
- **FR-003**: System MUST support English and Arabic translations (i18n). All UI text MUST use i18n keys.
- **FR-004**: System MUST display all prices in EGP (Egyptian Pounds).
- **FR-005**: Any UI modifications MUST strictly adhere to the UI MODIFICATION RULES (preserve existing UI, match design system).
- **FR-006**: Sensitive backend logic (checkout, payments, inventory, coupons, loyalty points) MUST be server-side via Edge Functions or SQL RPCs.
- **FR-007**: System MUST enforce strict RLS, server-side validation, and idempotency for all critical operations.

### Key Entities

- **Product**: Perfume items available for sale, including titles, descriptions, pricing (EGP), and multi-language support.
- **Order**: Customer purchases linking products, user details, and payment/status tracking.
- **User**: Authentication and profile data managed via Supabase.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Both web and mobile applications successfully connect to and sync with the Supabase backend.
- **SC-002**: Users can switch between English and Arabic with 100% of static UI strings translated.
- **SC-003**: Visual regression tests or design reviews confirm 0 instances of breaking the existing core UI design when adding new elements.
