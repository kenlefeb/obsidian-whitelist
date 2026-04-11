# Research Notes - Status Bar Indicator

## Key Decisions

- **Render API**: Use Obsidian's `addStatusBarItem(): HTMLElement` from the Plugin base class. It is the only supported way to attach to the status bar and is available on desktop; on mobile views without a status bar it returns a detached element, which is the silent-degradation path required by FR-002 / UX-002.
- **Icon rendering**: Use Obsidian's `setIcon(el, iconId)` helper with Lucide icon names (`alert-triangle` / `check-circle`). Already used elsewhere in the codebase pattern; no extra dependency.
- **Click handling**: Wire `addEventListener("click")` directly on the returned HTMLElement. Plugin lifecycle cleanup handled automatically because Obsidian removes status bar items on plugin unload — no manual `register*` call needed for the element itself, but listener cleanup happens at element removal.
- **Modal re-open contract**: Reuse existing `showComplianceModal(app, violations)` from `src/compliance-modal.ts`. The status bar click path produces the same justification flow as boot, so the click handler will await the modal and write the notification file via existing `writeComplianceNotification`. Avoids duplicating compliance flow logic.
- **State source**: Read `complianceResult` directly from the `WhitelistPlugin` instance (already populated by `runBootComplianceFlow`). No new state container; the indicator is a pure projection of existing plugin state.
- **No re-render observer**: MVP scans only at boot (per PRD non-goal: no mid-session detection). Indicator renders once after boot scan completes, plus once on settings save when `showCompliantIndicator` toggles. No reactive subscription layer needed.

## Critical Risks

- **Mobile status bar absence**: `addStatusBarItem()` may produce a non-visible element on mobile. → Silent degradation; no error surfaced (UX-002, FR-002). Status bar item still created so DOM access in tests stays consistent.
- **Click race after modal submit**: User clicks indicator while a modal is already open from a prior click. → Guard with a `modalOpen` boolean inside the click handler to prevent stacking.
- **Stale violation count after settings change**: Toggling `showCompliantIndicator` while compliant should hide/show the existing item. → Re-render hook in `saveSettings` path; status bar item is destroyed and recreated to avoid stale DOM.

## Stack Compatibility

- Obsidian Plugin API + TypeScript + esbuild: ✔ (already in use)
- Vitest unit tests with Obsidian API mocks: ✔ (pattern established by `compliance-modal.test.ts`, `notification-file.test.ts`)
- No new runtime dependencies introduced.
