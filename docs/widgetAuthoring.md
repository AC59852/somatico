# Adding a New Widget

This is the only doc you need to read to add a widget to the dashboard. You
should never need to open `composables/usePersonaEngine.ts` to do this — if
you find yourself needing to, something in this contract is leaking and
that's worth flagging, not working around.

## The contract

Every widget's domain controller returns a `DomainIntentProfile`
(`types/widget-contract.ts`):

```ts
interface DomainIntentProfile {
  domainId: string
  intentWeight: number              // 0..1
  confidence: number                // 0..1, ramps with THIS domain's own data age
  associatedTags: string[]
  canTriggerIntegrations: boolean
}
```

The orchestrator only ever sees this shape. It never imports a widget's
components, raw DB rows, or internal types.

## Steps to add a widget

1. **Data:** if your widget needs its own raw storage beyond the shared
   `widget_analytics` / `keywords` stores, add an object store in
   `types/db.ts` and bump `DB_VERSION` in `composables/useAppDB.ts` — **in
   the same PR**, and say so in the PR description. The other dev's local
   IndexedDB needs to pick up the migration.
2. **Controller:** write `utils/domains/<yourWidget>.ts`, exporting one
   function matching `DomainAnalyzer`. Use `utils/domains/news.ts` as the
   template for *shape*, not for its specific thresholds/logic.
3. **Integration rules (optional):** if your widget should be able to
   unlock a follow-on feature/prompt, add a rule to
   `utils/integrationRules.ts`. Domain-specific "if X then unlock Y" logic
   always lives here — **never** inline in `usePersonaEngine.ts`.
4. **Register:** add your analyzer function to the `domainAnalyzers` array
   in `composables/usePersonaEngine.ts`. This one line is the only edit you
   make to a file you don't own.
5. **Telemetry:** drop `useWidgetTelemetry('yourWidgetId')` into your
   widget's root component for dwell/idle tracking — fires on interaction,
   not on unmount, so it survives abrupt tab closes. Free, no setup.
6. **Mock data — two kinds, don't conflate them:**
   - *Display fixtures* (like `utils/mock/newsFixtures.ts`) — fake content
     your widget renders, shaped like the real API response will be.
   - *Seeded history* — fake `widget_analytics`/`keywords` rows simulating
     days of usage, so you can test confidence ramping without waiting 3
     real days. Gate this behind `import.meta.dev` — never let it run
     against a real user's empty-but-real database.

## Rules

- A widget's component or controller never reads another widget's object
  store directly.
- Domain-specific logic never goes in `usePersonaEngine.ts` — that file
  only loops over the registry and the rules array.
- `domainId` must be globally unique and match the `widgetId` you pass to
  `useWidgetTelemetry`.
- Confidence is always scoped to that domain's own first-seen timestamp,
  never a global "system age."

## Removing a widget

1. Delete `utils/domains/<widget>.ts`.
2. Remove its line from `domainAnalyzers`.
3. Delete any integration rules referencing it.
4. Its rows in IndexedDB simply stop being read — nothing dereferences
   them, so there's no migration required to "remove" it. A cleanup
   function to purge old rows is a nice-to-have, not a requirement.