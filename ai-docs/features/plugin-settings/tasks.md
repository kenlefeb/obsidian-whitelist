# Tasks: Plugin Settings

## Purpose
TDD-structured implementation tasks for the plugin-settings feature. Refactors existing settings module to match PRD terminology, adds new fields, and upgrades the settings UI.

## Phase 1: Core Infrastructure

- [x] INIT-001 Install Vitest and configure test environment in `vitest.config.ts`
- [x] INIT-002 Create `tests/unit/` directory structure per plan.md
- [x] INIT-003 Create Obsidian API mock helpers in `tests/mocks/obsidian.ts` (mock Plugin, App, Setting, PluginSettingTab)
- [x] INIT-004 Refactor `src/settings.ts`: define WhitelistSettings interface with whitelist, blacklist, notificationDirectory, showCompliantIndicator fields per data-model.md
- [x] INIT-005 Define DEFAULT_SETTINGS constant using DEFAULT_NOTIFICATION_DIR (`.obsidian-whitelist/notifications/`), DEFAULT_SHOW_COMPLIANT (false), DEFAULT_WHITELIST ([]), DEFAULT_BLACKLIST ([]) per data-model.md
- [x] INIT-006 Remove EnforcementMode enum from `src/settings.ts` per research.md
- [x] INIT-007 Refactor `src/main.ts`: update WhitelistPlugin to use new WhitelistSettings field names, remove Enforcer class per plan.md

## Phase 2: User Story 1 - Default Settings on First Load (P1)

### TDD Cycle 1: Settings Loading and Merge
**Coverage**:
- Requirements: FR-001, FR-002, FR-004
- Data entities: WhitelistSettings
- Constants: DEFAULT_NOTIFICATION_DIR, DEFAULT_SHOW_COMPLIANT, DEFAULT_WHITELIST, DEFAULT_BLACKLIST

#### RED Phase
- [ ] TEST-001 [US1] Test that loadSettings with null/undefined data returns DEFAULT_SETTINGS in `tests/unit/settings.test.ts`
- [ ] TEST-002 [US1] Test that loadSettings merges partial data with defaults (missing fields filled) in `tests/unit/settings.test.ts`
- [ ] TEST-003 [US1] Test that loadSettings with empty notificationDirectory replaces with DEFAULT_NOTIFICATION_DIR in `tests/unit/settings.test.ts`

#### GREEN Phase
- [ ] IMPL-001 [US1] Implement `mergeSettings(loaded: Partial<WhitelistSettings>): WhitelistSettings` helper in `src/settings.ts`
- [ ] IMPL-002 [US1] Update `loadSettings()` in `src/main.ts` to use mergeSettings with empty directory fallback

## Phase 3: User Story 2 - Add Plugin IDs to Whitelist (P1)

### TDD Cycle 1: Plugin ID Validation
**Coverage**:
- Requirements: FR-006
- Data entities: PluginId
- Validation: PluginId Validation rules from data-model.md

#### RED Phase
- [ ] TEST-004 [US2] Test that addPluginId rejects empty string after trim in `tests/unit/settings.test.ts`
- [ ] TEST-005 [US2] Test that addPluginId rejects duplicate ID already in target list in `tests/unit/settings.test.ts`
- [ ] TEST-006 [US2] Test that addPluginId trims whitespace before adding and preserves original casing per CHK039 in `tests/unit/settings.test.ts`
- [ ] TEST-007 [US2] Test that addPluginId adds valid ID to whitelist array in `tests/unit/settings.test.ts`

#### GREEN Phase
- [ ] IMPL-003 [US2] Implement `validatePluginId(id: string, list: string[], otherList: string[]): string | null` validation helper in `src/settings.ts` (returns error message or null; no self-exclusion — plugin's own ID is allowed per CHK002)
- [ ] IMPL-004 [US2] Implement `addPluginId(list: string[], id: string): { list: string[], error?: string }` in `src/settings.ts`

### TDD Cycle 2: Whitelist Settings UI
**Coverage**:
- Requirements: FR-003, FR-005, FR-006, UX-001, UX-002, UX-003
- Components: PluginSettingTab, SectionHeading, PluginIdInput, PluginListContainer, PluginListEntry, ButtonComponent

#### RED Phase
- [ ] TEST-008 [US2] Test that removePluginId removes ID from whitelist array in `tests/unit/settings.test.ts`

#### GREEN Phase
- [ ] IMPL-005 [US2] Implement `removePluginId(list: string[], id: string): string[]` in `src/settings.ts`
- [ ] IMPL-006 [US2] Implement `renderPluginList()` helper in WhitelistSettingTab: clears container, renders PluginListEntry for each ID with trash button in `src/settings.ts`
- [ ] IMPL-007 [US2] Rebuild WhitelistSettingTab.display() with Whitelist section: SectionHeading, PluginIdInput (Setting + addText + addButton), PluginListContainer in `src/settings.ts`

### From CHK009: Cross-List Duplicate Prevention
**Coverage**:
- Resolution: Prevent adding a plugin ID to one list if it already exists in the other list

#### RED Phase
- [ ] TEST-016 [US2] Test that addPluginId rejects ID already present in the other list (e.g., adding to whitelist when already in blacklist) in `tests/unit/settings.test.ts`

#### GREEN Phase
- [ ] IMPL-012 [US2] Update `validatePluginId` to accept `otherList` parameter and reject cross-list duplicates in `src/settings.ts`

### From CHK032: Plugin ID Format Enforcement per Obsidian Docs
**Coverage**:
- Resolution: Enforce Obsidian official manifest rules — ID must not contain the word "obsidian"

#### RED Phase
- [ ] TEST-017 [US2] Test that addPluginId rejects IDs containing the word "obsidian" (case-insensitive check) in `tests/unit/settings.test.ts`

#### GREEN Phase
- [ ] IMPL-013 [US2] Update `validatePluginId` to reject IDs containing "obsidian" per Obsidian manifest rules in `src/settings.ts`

## Phase 4: User Story 3 - Add Plugin IDs to Blacklist (P1)

### TDD Cycle 1: Blacklist List Management
**Coverage**:
- Requirements: FR-003, FR-006
- Components: PluginIdInput, PluginListContainer, PluginListEntry

#### RED Phase
- [ ] TEST-009 [US3] Test that addPluginId adds valid ID to blacklist array in `tests/unit/settings.test.ts`
- [ ] TEST-010 [US3] Test that removePluginId removes ID from blacklist array in `tests/unit/settings.test.ts`

#### GREEN Phase
- [ ] IMPL-008 [US3] Add Blacklist section to WhitelistSettingTab.display(): SectionHeading, PluginIdInput, PluginListContainer (reuses renderPluginList pattern) in `src/settings.ts`

## Phase 5: User Story 4 - Change Notification Directory (P2)

### TDD Cycle 1: Notification Directory Setting
**Coverage**:
- Requirements: FR-003, FR-004, FR-005
- Data entities: WhitelistSettings.notificationDirectory
- Constants: DEFAULT_NOTIFICATION_DIR
- Components: NotificationDirectorySetting, TextComponent

#### RED Phase
- [ ] TEST-011 [US4] Test that saving empty notification directory stores empty string (fallback applied on load, not save) in `tests/unit/settings.test.ts`
- [ ] TEST-012 [US4] Test that saving non-empty directory path persists the value in `tests/unit/settings.test.ts`

#### GREEN Phase
- [ ] IMPL-009 [US4] Add Notifications section to WhitelistSettingTab.display(): SectionHeading, NotificationDirectorySetting (Setting + addText with placeholder DEFAULT_NOTIFICATION_DIR, save on change) in `src/settings.ts`

## Phase 6: User Story 5 - Toggle Compliant Status Bar Indicator (P2)

### TDD Cycle 1: Compliant Indicator Toggle
**Coverage**:
- Requirements: FR-003, FR-005
- Data entities: WhitelistSettings.showCompliantIndicator
- Constants: DEFAULT_SHOW_COMPLIANT
- Components: CompliantIndicatorToggle, ToggleComponent

#### RED Phase
- [ ] TEST-013 [US5] Test that toggling showCompliantIndicator from false to true persists in settings in `tests/unit/settings.test.ts`

#### GREEN Phase
- [ ] IMPL-010 [US5] Add Display section to WhitelistSettingTab.display(): SectionHeading, CompliantIndicatorToggle (Setting + addToggle, save on change) in `src/settings.ts`

## Phase 7: User Story 6 - Pre-configured data.json Loading (P3)

### TDD Cycle 1: Filesystem-Deployed Configuration
**Coverage**:
- Requirements: FR-002
- Data entities: WhitelistSettings

#### RED Phase
- [ ] TEST-014 [US6] Test that mergeSettings with fully populated data returns all provided values (no defaults override) in `tests/unit/settings.test.ts`
- [ ] TEST-015 [US6] Test that mergeSettings with extra unknown fields ignores them and returns valid WhitelistSettings in `tests/unit/settings.test.ts`

#### GREEN Phase
- [ ] IMPL-011 [US6] Verify mergeSettings implementation handles full and extra-field scenarios (may already pass from US1 implementation)

## Execution Order

1. **Phase 1**: Core Infrastructure (blocks all stories)
2. **Phase 2**: US1 - Default Settings on First Load (P1)
3. **Phase 3**: US2 - Add Plugin IDs to Whitelist (P1)
4. **Phase 4**: US3 - Add Plugin IDs to Blacklist (P1)
5. **Phase 5**: US4 - Change Notification Directory (P2)
6. **Phase 6**: US5 - Toggle Compliant Status Bar Indicator (P2)
7. **Phase 7**: US6 - Pre-configured data.json Loading (P3)

Within each story: RED → GREEN cycles

## Notes

- Tasks organized by TDD cycles: RED → GREEN
- Stories execute in priority order (P1 → P2 → P3)
- Each story independently testable after Phase 1
- Tests precede implementation
- No test stubs or always-passing mocks
- addPluginId/removePluginId/validatePluginId are pure functions testable without Obsidian mocking
- WhitelistSettingTab UI tasks require Obsidian mock but follow established patterns
- TEST-/IMPL- numbering is sequential across all user stories
