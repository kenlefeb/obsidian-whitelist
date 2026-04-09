# Feature Index

Total Features: 6

## Features List

### Compliance Engine (2 features)

- **Plugin Compliance Scan**
  - Folder: `plugin-compliance-scan`

- **Status Bar Indicator**
  - Folder: `status-bar-indicator`

### Notifications (2 features)

- **Compliance Notification Modal**
  - Folder: `compliance-notification-modal`

- **IS Notification File**
  - Folder: `is-notification-file`

### Configuration (2 features)

- **Plugin Settings**
  - Folder: `plugin-settings`

- **Distribution Packaging**
  - Folder: `distribution-packaging`

## Implementation Sequence

**Recommended Order:** Foundation settings first, then core scan engine, then parallel output features, finally packaging.

### Phase 1: Foundation (data model and configuration)
1. **Plugin Settings** - Defines the settings interface, persistence, and settings UI that all other features depend on

### Phase 2: Core (detection engine)
2. **Plugin Compliance Scan** - Core scanning logic; depends on: `plugin-settings`

### Phase 3: Output (notification and visibility — can be parallel)
3. **Compliance Notification Modal** - Blocking modal for user acknowledgment; depends on: `plugin-compliance-scan`
4. **IS Notification File** - File-based IS alerting; depends on: `plugin-compliance-scan`, `compliance-notification-modal`
5. **Status Bar Indicator** - Persistent compliance visibility; depends on: `plugin-compliance-scan`, `compliance-notification-modal`

### Phase 4: Delivery (packaging for enterprise distribution)
6. **Distribution Packaging** - Build and zip for deployment; depends on: all features complete
