# Implementation Plan: Compliance Notification Modal

## Purpose
Translates feature requirements into technical implementation strategy.

## Summary
Implement a blocking Obsidian Modal subclass that displays compliance violations and collects an optional justification message. Uses a Promise-based API for clean async integration. The modal prevents dismissal until the user submits.

## Technical Context

**Language:** TypeScript (existing)

**Framework:** Obsidian Plugin API (Modal, ButtonComponent)

**Storage:** None — modal is transient UI

**API Layer:** None — internal module with Promise-based function

**Testing:** Vitest for logic (reason text mapping, justification handling); Modal UI tested manually

**Constraints:** Must work on desktop and mobile; must block dismissal until submit

## Implementation Mapping

### Component Architecture
- **src/compliance-modal.ts** (new): `ComplianceModal` class extending Modal, `showComplianceModal(app, violations)` async function returning `Promise<string>`
  - `onOpen()`: renders header, violation list, justification textarea, submit button
  - `close()` override: only allows close when `submitted` flag is true
  - Submit handler: sets submitted=true, captures justification, calls `close()`
  - Reason text mapping: `REASON_DISPLAY_TEXT` constant // from data-model.md
- **src/main.ts** (modify): After compliance scan in onLayoutReady, if non-compliant, await `showComplianceModal()` and store justification

### UI Component → Code Mapping (from ui.md)
- ComplianceModal → `ComplianceModal` class in `compliance-modal.ts`
- ModalHeader → `contentEl.createEl('h2')` in `onOpen()`
- ViolationDescription → `contentEl.createEl('p')` in `onOpen()`
- ViolationList → `contentEl.createDiv({ cls: 'violation-list' })` with scroll CSS
- ViolationItem → `listEl.createDiv()` per violation with name + reason badge
- JustificationInput → `contentEl.createEl('textarea')` in `onOpen()`
- SubmitButton → `new ButtonComponent(contentEl)` with CTA style

### Error Handling Approach
- No error states — modal is pure local UI
- Empty justification accepted without error

## Feature Code Organization

### Feature Implementation

```
src/
├── main.ts                # WhitelistPlugin (modify: show modal after scan)
├── settings.ts            # Existing
├── compliance.ts          # Existing
└── compliance-modal.ts    # ComplianceModal class, showComplianceModal()

tests/
└── unit/
    ├── settings.test.ts       # Existing
    ├── compliance.test.ts     # Existing
    └── compliance-modal.test.ts # Reason text mapping, justification logic
```

**Selected Structure:** A (Standalone Module) — New modal module alongside existing files.

## Testing Approach
- **Unit tests** (`tests/unit/compliance-modal.test.ts`):
  - Reason display text mapping for each ViolationReason
  - Justification trimming (whitespace handling)
  - showComplianceModal not called when no violations
  - Export type verification
- **Manual verification**:
  - Modal blocks until submit on desktop and mobile
  - Escape key and background click do not dismiss
  - Violation list scrolls with 10+ items
  - Empty justification accepted
  - Re-open from status bar works (tested in status-bar-indicator feature)

## Implementation Notes
- **Promise pattern**: `showComplianceModal()` creates modal, opens it, and returns a Promise that resolves when the user submits. This lets main.ts `await` the justification before proceeding to write the notification file.
- **Close blocking**: Override `close()` to check `this.submitted` flag. If not submitted, return early (no-op). This handles both Escape key and background click since Obsidian routes both through `close()`.
- **Re-open support**: The function creates a new modal instance each time — no state to reset. Status bar click (future feature) simply calls `showComplianceModal()` again.
