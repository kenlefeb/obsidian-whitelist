## UI Specification: Status Bar Indicator

**Platform**: Desktop + Mobile (Obsidian Plugin)
**Design System**: Custom (Obsidian native — `addStatusBarItem()` HTMLElement)

## Component Trees

### StatusBarIndicator
**Entry**: Rendered after plugin boot when compliance scan result is available, and re-rendered when settings change.
**Purpose**: Persistent visual indicator of vault compliance state in the Obsidian status bar.

```json
{
  "status_bar_indicator": {
    "component": "StatusBarItemRoot",
    "children": [
      {
        "component": "ComplianceIcon",
        "props": { "variant": "warning | check" },
        "slot": false,
        "children": [],
        "notes": "Obsidian setIcon() — 'alert-triangle' for non-compliant, 'check-circle' for compliant"
      },
      {
        "component": "ComplianceLabel",
        "props": { "variant": "non-compliant | compliant" },
        "slot": false,
        "children": [],
        "notes": "Text node: `Non-compliant (${count})` or `Compliant`"
      }
    ]
  }
}
```

## Component Catalog

```json
{
  "StatusBarItemRoot": {
    "ds_component": "Obsidian addStatusBarItem() HTMLElement",
    "variants": ["non-compliant", "compliant", "hidden"],
    "visual_states": {
      "non-compliant": "Container with warning text color (--text-warning); cursor pointer; role=button; tabindex=0",
      "compliant": "Container with default status bar text color; cursor default; role=status",
      "hidden": "No element rendered (DOM-removed)"
    },
    "used_in": ["status_bar_indicator"]
  },
  "ComplianceIcon": {
    "ds_component": "Obsidian setIcon() span",
    "variants": ["warning", "check"],
    "visual_states": {
      "warning": "alert-triangle Lucide icon, inherits warning color from parent",
      "check": "check-circle Lucide icon, inherits default color from parent"
    },
    "used_in": ["status_bar_indicator"]
  },
  "ComplianceLabel": {
    "ds_component": "Plain text node inside status bar item span",
    "variants": ["non-compliant", "compliant"],
    "visual_states": {
      "non-compliant": "Reads `Non-compliant (N)` where N is violation count",
      "compliant": "Reads `Compliant`"
    },
    "used_in": ["status_bar_indicator"]
  }
}
```

## Layout Structure

```json
{
  "status_bar_indicator": {
    "layout": "horizontal-split",
    "areas": [
      {
        "name": "icon",
        "position": "left",
        "sticky": false,
        "scroll": false,
        "layout": null
      },
      {
        "name": "label",
        "position": "left",
        "sticky": false,
        "scroll": false,
        "layout": null
      }
    ]
  }
}
```

## Visual State Mapping

```json
{
  "uninitialized": {
    "visible": [],
    "hidden": ["StatusBarItemRoot", "ComplianceIcon", "ComplianceLabel"],
    "modified": {}
  },
  "non_compliant": {
    "visible": ["StatusBarItemRoot", "ComplianceIcon", "ComplianceLabel"],
    "hidden": [],
    "modified": {
      "StatusBarItemRoot": { "variant": "non-compliant", "aria-label": "Non-compliant: N plugin violations. Click to view." },
      "ComplianceIcon": { "variant": "warning" },
      "ComplianceLabel": { "variant": "non-compliant" }
    }
  },
  "compliant_visible": {
    "visible": ["StatusBarItemRoot", "ComplianceIcon", "ComplianceLabel"],
    "hidden": [],
    "modified": {
      "StatusBarItemRoot": { "variant": "compliant", "aria-label": "Compliant" },
      "ComplianceIcon": { "variant": "check" },
      "ComplianceLabel": { "variant": "compliant" }
    }
  },
  "compliant_hidden": {
    "visible": [],
    "hidden": ["StatusBarItemRoot", "ComplianceIcon", "ComplianceLabel"],
    "modified": {}
  }
}
```

## Responsive Adaptations

```json
{
  "mobile": {
    "StatusBarItemRoot": "Touch target padding ≥ 44×44 CSS px; degrades silently if status bar API unavailable on current view",
    "ComplianceLabel": "Same concise format — no additional truncation needed since label is already short"
  },
  "desktop": {
    "StatusBarItemRoot": "Default Obsidian status bar item sizing — no overrides"
  }
}
```
