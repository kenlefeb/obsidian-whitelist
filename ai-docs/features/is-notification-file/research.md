# Research Notes - IS Notification File

## Key Decisions
- **Obsidian Vault adapter API**: Use `this.app.vault.adapter.write()` and `this.app.vault.adapter.exists()` / `mkdir()` — abstracts filesystem across desktop and mobile
- **Vault-relative paths only**: The notification directory from settings is vault-relative; mobile Obsidian can only write within the vault
- **ISO timestamp filename**: Use `new Date().toISOString().replace(/[:.]/g, '-')` to create filesystem-safe unique filenames — avoids collisions when multiple events occur in the same session
- **JSON Lines vs single file per event**: Single file per event is simpler, avoids read-modify-write race conditions, and each file is self-contained for IS pickup
- **Vault name source**: Use `this.app.vault.getName()` for the vault name field
- **Pure function + I/O wrapper separation**: `buildComplianceEvent()` is a pure function (testable); `writeComplianceNotification()` does the I/O (tested via mocked adapter)

## Critical Risks
- **Vault adapter API differences on mobile**: Some `DataAdapter` methods behave differently on mobile → Mitigation: use only the documented portable methods (`write`, `exists`, `mkdir`)
- **Error handling must not crash plugin**: File write failures must be caught → Mitigation: try/catch wrapper, show Notice, log to console, continue

## Stack Compatibility
- Obsidian Vault Adapter API (`write`, `exists`, `mkdir`): ✔
- Obsidian Notice API for error feedback: ✔
- Depends on plugin-settings (notificationDirectory): ✔
- Depends on plugin-compliance-scan (Violation type): ✔
- Depends on compliance-notification-modal (justification flow): ✔
