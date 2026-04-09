# Research Notes - Compliance Notification Modal

## Key Decisions
- **Obsidian Modal subclass**: Extend `Modal` class, override `onOpen()` and `onClose()` — standard Obsidian pattern
- **Block dismissal by overriding close**: Set a flag to prevent `close()` from working until submit; Obsidian's Modal.close() is the single exit path for Escape and background click
- **Promise-based API**: `showComplianceModal(app, violations)` returns `Promise<string>` resolving with justification text on submit — clean async integration with main.ts
- **Reason display text**: Map ViolationReason enum to human-readable strings: "not_on_whitelist" → "Not on approved list", "on_blacklist" → "On blocked list"
- **Scrollable violation list**: Use CSS `max-height` + `overflow-y: auto` on the list container for 10+ violations

## Critical Risks
- **Mobile modal behavior**: Obsidian's Modal works on mobile but scrolling within a modal can be tricky → Mitigation: test on mobile, keep layout simple
- **Escape key on mobile**: Mobile may not have Escape key → Not an issue since we block close() itself, not just the key

## Stack Compatibility
- Obsidian Modal API: ✔
- Depends on compliance.ts (Violation type): ✔
