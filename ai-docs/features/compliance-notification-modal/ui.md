# UI Specification: Compliance Notification Modal

**Platform**: Desktop (Windows, macOS, Linux) + Mobile (iOS, Android) — Obsidian
**Design System**: Obsidian Native (Modal API)

## Component Trees

### Compliance Modal
Entry: Triggered by compliance scan finding violations (boot time or status bar click). Purpose: Display violations and collect user justification.

```json
{
  "compliance_modal": {
    "component": "Modal",
    "children": [
      {
        "component": "ModalHeader",
        "props": { "text": "Plugin Compliance Notice" },
        "slot": false,
        "children": [],
        "notes": "Created via contentEl.createEl('h2'); includes violation count"
      },
      {
        "component": "ViolationDescription",
        "props": {},
        "slot": false,
        "children": [],
        "notes": "Paragraph explaining non-compliant plugins were detected"
      },
      {
        "component": "ViolationList",
        "props": {},
        "slot": true,
        "children": [
          {
            "component": "ViolationItem",
            "props": { "pluginName": "example", "reason": "not_on_whitelist" },
            "slot": false,
            "children": [],
            "notes": "Repeated per violation; shows plugin name and reason text"
          }
        ],
        "notes": "Scrollable container for violation entries; slot accepts 0..N ViolationItem children"
      },
      {
        "component": "JustificationInput",
        "props": { "placeholder": "Optional: explain why these plugins are installed" },
        "slot": false,
        "children": [],
        "notes": "TextAreaComponent for user justification; empty submission allowed"
      },
      {
        "component": "SubmitButton",
        "props": { "label": "Acknowledge" },
        "slot": false,
        "children": [],
        "notes": "Closes modal and returns justification text"
      }
    ]
  }
}
```

## Component Catalog

```json
{
  "ComplianceModal": {
    "ds_component": "Modal (Obsidian)",
    "variants": [],
    "visual_states": {
      "displaying": "Modal open with violations and justification input",
      "hidden": "Modal not rendered"
    },
    "used_in": ["compliance_modal"]
  },
  "ModalHeader": {
    "ds_component": "HTMLHeadingElement (h2)",
    "variants": [],
    "visual_states": {
      "default": "Header text with violation count"
    },
    "used_in": ["compliance_modal"]
  },
  "ViolationList": {
    "ds_component": "HTMLDivElement (scrollable container)",
    "variants": [],
    "visual_states": {
      "scrollable": "Content exceeds container height, scroll enabled",
      "fits": "All violations visible without scrolling"
    },
    "used_in": ["compliance_modal"]
  },
  "ViolationItem": {
    "ds_component": "HTMLDivElement",
    "variants": ["not_on_whitelist", "on_blacklist"],
    "visual_states": {
      "default": "Plugin name with violation reason badge"
    },
    "used_in": ["compliance_modal"]
  },
  "JustificationInput": {
    "ds_component": "HTMLTextAreaElement",
    "variants": [],
    "visual_states": {
      "empty": "Placeholder text visible",
      "filled": "User-entered text visible"
    },
    "used_in": ["compliance_modal"]
  },
  "SubmitButton": {
    "ds_component": "ButtonComponent (Obsidian)",
    "variants": ["cta"],
    "visual_states": {
      "default": "Clickable button with Acknowledge label"
    },
    "used_in": ["compliance_modal"]
  }
}
```

## Layout Structure

### Compliance Modal

```json
{
  "compliance_modal": {
    "layout": "vertical-stack",
    "areas": [
      {
        "name": "header",
        "position": "top",
        "sticky": false,
        "scroll": false,
        "layout": null
      },
      {
        "name": "violation-list",
        "position": "center",
        "sticky": false,
        "scroll": true,
        "layout": "vertical-stack"
      },
      {
        "name": "justification",
        "position": "center",
        "sticky": false,
        "scroll": false,
        "layout": null
      },
      {
        "name": "actions",
        "position": "bottom",
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
  "hidden": {
    "visible": [],
    "hidden": ["ComplianceModal"],
    "modified": {}
  },
  "displaying": {
    "visible": [
      "ComplianceModal",
      "ModalHeader",
      "ViolationDescription",
      "ViolationList",
      "ViolationItem",
      "JustificationInput",
      "SubmitButton"
    ],
    "hidden": [],
    "modified": {}
  },
  "submitted": {
    "visible": [],
    "hidden": ["ComplianceModal"],
    "modified": {}
  }
}
```
