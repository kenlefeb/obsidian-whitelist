# Implementation Plan: Plugin Settings

## Purpose
Translates feature requirements into technical implementation strategy.

## Summary
Refactor existing settings module to match PRD terminology (whitelist/blacklist), add notification directory and compliant indicator fields, and upgrade the settings UI from comma-separated textareas to individual add/remove entry management. Builds on existing `src/settings.ts` and `src/main.ts` patterns.

## Technical Context

**Language:** TypeScript (existing)

**Framework:** Obsidian Plugin API (PluginSettingTab, Setting, TextComponent, ToggleComponent, ButtonComponent)

**Storage:** Obsidian plugin `data.json` via `this.loadData()` / `this.saveData()` — standard pattern already in place

**API Layer:** None — internal settings only

**Testing:** Vitest for unit tests on settings merge/validation logic; manual verification in Obsidian vault for UI

**Deployment:** Copy to `.obsidian/plugins/obsidian-whitelist/` in test vault

**Constraints:** All file operations via Obsidian Vault API for mobile compatibility; no Node.js `fs`

## Implementation Mapping

### Component Architecture
- **settings.ts** (refactor existing): WhitelistSettings interface, DEFAULT_SETTINGS, validation helpers, WhitelistSettingTab class
  - Remove EnforcementMode enum and mode field — per research.md
  - Rename `allowed` → `whitelist`, `prohibited` → `blacklist`
  - Add `notificationDirectory` and `showCompliantIndicator` fields
  - WhitelistSettingTab.display() rebuilt with section headings, add/remove list pattern, directory input, toggle
- **main.ts** (refactor existing): Update WhitelistPlugin to use new field names; remove Enforcer class (moves to plugin-compliance-scan feature)

### UI Component → Code Mapping (from ui.md)
- PluginSettingTab → `WhitelistSettingTab` class in `settings.ts`
- SectionHeading → `containerEl.createEl('h3', { text })` calls
- PluginIdInput → `new Setting()` with `.addText()` + `.addButton()` — one per list
- PluginListContainer → wrapper div created via `containerEl.createDiv()`
- PluginListEntry → `new Setting()` with `.setName(pluginId)` + `.addButton({ icon: 'trash' })` — dynamic, rebuilt on add/remove
- NotificationDirectorySetting → `new Setting()` with `.addText()` + onblur save
- CompliantIndicatorToggle → `new Setting()` with `.addToggle()`
- Slot components (PluginListContainer) → dynamic children rebuilt via `renderList()` helper method

### Error Handling Approach
- Malformed `data.json` → `Object.assign({}, DEFAULT_SETTINGS, loadedData)` gracefully merges (existing pattern)
- Empty notification directory → replaced with DEFAULT_NOTIFICATION_DIR on load // from data-model.md
- Duplicate plugin ID → inline error via Setting.setDesc() with error class
- Empty plugin ID → inline error via Setting.setDesc() with error class
- Save failure → Obsidian Notice toast

## Feature Code Organization

### Feature Implementation

```
src/
├── main.ts              # WhitelistPlugin (refactor: remove Enforcer, update field names)
└── settings.ts          # WhitelistSettings interface, defaults, validation, WhitelistSettingTab

tests/
└── unit/
    └── settings.test.ts # Settings merge, validation, defaults
```

**Selected Structure:** A (Standalone Module) — Single-feature plugin with two source files; no API layer, no separate frontend/backend split needed. Existing structure already matches.

## Testing Approach
- **Unit tests** (`tests/unit/settings.test.ts`):
  - Default settings applied when no data.json exists (P1 scenario 1)
  - Settings merge preserves existing values and fills missing fields (edge case: malformed data.json)
  - Empty notification directory falls back to default (edge case: empty path)
  - Plugin ID validation: rejects empty strings, rejects duplicates, trims whitespace
  - Whitelist/blacklist add and remove operations on the settings object
- **Manual verification**:
  - Settings tab renders correctly in Obsidian desktop and mobile
  - Add/remove entries persist across reload
  - Toggle updates status bar (verified in status-bar-indicator feature)
  - Pre-configured data.json loads correctly (P3 scenario 6)

## Implementation Notes
- **Existing code reuse**: Keep the `loadSettings()` merge pattern from current `main.ts` — it correctly handles missing fields via `Object.assign`
- **Breaking change**: Renaming `allowed`→`whitelist` and `prohibited`→`blacklist` means existing `data.json` files will lose those values on upgrade. Since plugin is pre-release (1.0.0-beta), this is acceptable. Old fields are silently ignored and defaults applied.
- **Remove Enforcer class**: The stub `Enforcer` in `main.ts` belongs to the plugin-compliance-scan feature. Remove it from this feature's scope — it will be implemented in Phase 2.
- **List rebuild pattern**: When adding/removing entries, call a `renderList()` helper that clears the container div and rebuilds all PluginListEntry settings. This avoids complex DOM manipulation and matches Obsidian's pattern of calling `display()` to refresh.
- **Edge case coverage**: All spec.md edge cases (empty directory, malformed data.json) handled via merge-with-defaults pattern. No future iteration needed.
