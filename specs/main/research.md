# Research & Decisions

## Decision 1: UI Modification Rules Enforcement
**Decision**: Follow strict UI matching based on existing CSS/design tokens.
**Rationale**: The user has explicitly set "UI MODIFICATION RULES (DO NOT BREAK)". Any new component must adapt to the established design system rather than introducing new paradigms.
**Alternatives considered**: Introducing a new design system wrapper (rejected due to direct user rule violation).

## Decision 2: Multi-platform Unified Backend
**Decision**: Use Supabase as the single source of truth for Web and Mobile.
**Rationale**: Enables seamless cross-platform experiences (e.g., shared cart, favorites) and simplifies backend architecture.
**Alternatives considered**: Separate backends or isolated databases (rejected due to operational overhead).
