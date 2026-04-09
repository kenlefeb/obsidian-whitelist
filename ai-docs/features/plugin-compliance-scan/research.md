# Research Notes - Plugin Compliance Scan

## Key Decisions
- **Obsidian API for plugin enumeration**: `this.app.plugins.manifests` returns all installed community plugin manifests; `this.app.plugins.enabledPlugins` is a Set of enabled plugin IDs — both available on desktop and mobile
- **Check installed, not just enabled**: FR-002 says check both installed and enabled — installed plugins are a risk even if disabled
- **Self-exclusion by plugin ID**: Exclude `this.manifest.id` from scan results (FR-001)
- **Blacklist precedence**: If a plugin is on both lists, blacklist wins (FR-005) — this is the logical safe default for enterprise compliance
- **Fail open when both lists empty**: No enforcement when no lists configured (FR-006) — avoids false positives during initial deployment
- **Pure function design**: `runComplianceScan()` takes settings + manifests as input, returns ComplianceResult — easily testable without Obsidian mocking

## Critical Risks
- **Plugin API access timing**: `app.plugins.manifests` may not be populated during early plugin load → Mitigation: use `app.workspace.onLayoutReady()` callback or verify manifests are available before scanning

## Stack Compatibility
- Obsidian Plugin API (`app.plugins.manifests`, `app.plugins.enabledPlugins`): ✔
- Depends on plugin-settings (WhitelistSettings): ✔ (merged to main)
