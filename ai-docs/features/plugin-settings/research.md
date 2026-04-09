# Research Notes - Plugin Settings

## Key Decisions
- **Rename fields to match PRD terminology**: `allowed` → `whitelist`, `prohibited` → `blacklist` — PRD and all downstream specs use whitelist/blacklist consistently
- **Remove EnforcementMode enum**: Existing code has Strict/Lax/Warn/Off modes not in PRD — enforcement is driven by list presence (whitelist has entries → whitelist enforcement active; blacklist has entries → blacklist enforcement active)
- **Add notificationDirectory and showCompliantIndicator fields**: Required by spec FR-001 — not present in existing settings interface
- **Upgrade list UI from textarea to add/remove pattern**: Existing comma-separated textarea is error-prone — spec UX-002 requires individual entry management with add/remove buttons
- **Keep existing loadSettings merge pattern**: Current `Object.assign({}, DEFAULT_SETTINGS, await this.loadData())` correctly handles missing fields per FR-002
- **Obsidian Setting API only**: No external UI libraries — Setting class with addText(), addToggle(), addButton() covers all needed controls

## Critical Risks
- **Breaking change for existing users**: Renaming settings fields invalidates existing `data.json` → Mitigation: merge with defaults handles missing new fields gracefully; old field names simply ignored

## Stack Compatibility
- Obsidian Plugin API (Setting, PluginSettingTab, TextComponent, ToggleComponent, ButtonComponent): ✔
- TypeScript + esbuild build pipeline: ✔ (existing)
- Cross-platform (desktop + mobile): ✔ (`isDesktopOnly: false` in manifest.json)
