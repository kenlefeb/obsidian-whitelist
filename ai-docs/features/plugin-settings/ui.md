# UI Specification: Plugin Settings

**Platform**: Desktop (Windows, macOS, Linux) + Mobile (iOS, Android) — Obsidian
**Design System**: Obsidian Native (PluginSettingTab, Setting API)

## Component Trees

### Settings Tab
Entry: User navigates to Obsidian Settings > Community Plugins > Obsidian Whitelist. Purpose: Configure whitelist, blacklist, notification directory, and status bar preferences.

```json
{
  "settings_tab": {
    "component": "PluginSettingTab",
    "children": [
      {
        "component": "SectionHeading",
        "props": { "text": "Whitelist" },
        "slot": false,
        "children": [],
        "notes": "Heading element created via containerEl.createEl('h3')"
      },
      {
        "component": "PluginIdInput",
        "props": { "list": "whitelist", "placeholder": "Enter plugin ID" },
        "slot": false,
        "children": [
          {
            "component": "TextComponent",
            "props": { "placeholder": "plugin-id" },
            "slot": false,
            "children": [],
            "notes": "Text input for typing new plugin ID"
          },
          {
            "component": "ButtonComponent",
            "props": { "label": "Add", "cta": true },
            "slot": false,
            "children": [],
            "notes": "Triggers add_plugin_to_list action"
          }
        ],
        "notes": "Setting row with text input and add button"
      },
      {
        "component": "PluginListContainer",
        "props": { "list": "whitelist" },
        "slot": true,
        "children": [
          {
            "component": "PluginListEntry",
            "props": { "pluginId": "example-plugin" },
            "slot": false,
            "children": [
              {
                "component": "ButtonComponent",
                "props": { "icon": "trash", "tooltip": "Remove" },
                "slot": false,
                "children": [],
                "notes": "Triggers remove_plugin_from_list action"
              }
            ],
            "notes": "Repeated for each whitelist entry; shows plugin ID text + remove button"
          }
        ],
        "notes": "Dynamic container; slot accepts 0..N PluginListEntry children based on settings.whitelist"
      },
      {
        "component": "SectionHeading",
        "props": { "text": "Blacklist" },
        "slot": false,
        "children": [],
        "notes": "Heading element created via containerEl.createEl('h3')"
      },
      {
        "component": "PluginIdInput",
        "props": { "list": "blacklist", "placeholder": "Enter plugin ID" },
        "slot": false,
        "children": [
          {
            "component": "TextComponent",
            "props": { "placeholder": "plugin-id" },
            "slot": false,
            "children": [],
            "notes": "Text input for typing new plugin ID"
          },
          {
            "component": "ButtonComponent",
            "props": { "label": "Add", "cta": true },
            "slot": false,
            "children": [],
            "notes": "Triggers add_plugin_to_list action"
          }
        ],
        "notes": "Setting row with text input and add button"
      },
      {
        "component": "PluginListContainer",
        "props": { "list": "blacklist" },
        "slot": true,
        "children": [
          {
            "component": "PluginListEntry",
            "props": { "pluginId": "example-plugin" },
            "slot": false,
            "children": [
              {
                "component": "ButtonComponent",
                "props": { "icon": "trash", "tooltip": "Remove" },
                "slot": false,
                "children": [],
                "notes": "Triggers remove_plugin_from_list action"
              }
            ],
            "notes": "Repeated for each blacklist entry"
          }
        ],
        "notes": "Dynamic container; slot accepts 0..N PluginListEntry children based on settings.blacklist"
      },
      {
        "component": "SectionHeading",
        "props": { "text": "Notifications" },
        "slot": false,
        "children": [],
        "notes": "Heading element created via containerEl.createEl('h3')"
      },
      {
        "component": "NotificationDirectorySetting",
        "props": {},
        "slot": false,
        "children": [
          {
            "component": "TextComponent",
            "props": { "placeholder": ".obsidian-whitelist/notifications/" },
            "slot": false,
            "children": [],
            "notes": "Vault-relative path input; saves on blur"
          }
        ],
        "notes": "Setting with name 'Notification Directory' and description explaining vault-relative path"
      },
      {
        "component": "SectionHeading",
        "props": { "text": "Display" },
        "slot": false,
        "children": [],
        "notes": "Heading element created via containerEl.createEl('h3')"
      },
      {
        "component": "CompliantIndicatorToggle",
        "props": {},
        "slot": false,
        "children": [
          {
            "component": "ToggleComponent",
            "props": { "value": "settings.showCompliantIndicator" },
            "slot": false,
            "children": [],
            "notes": "Toggle on/off; triggers toggle_compliant_indicator action"
          }
        ],
        "notes": "Setting with name 'Show compliant indicator' and description about status bar visibility"
      }
    ]
  }
}
```

## Component Catalog

```json
{
  "PluginSettingTab": {
    "ds_component": "PluginSettingTab",
    "variants": [],
    "visual_states": {
      "displaying": "All settings sections visible and editable"
    },
    "used_in": ["settings_tab"]
  },
  "SectionHeading": {
    "ds_component": "HTMLHeadingElement (h3)",
    "variants": [],
    "visual_states": {
      "default": "Bold heading text separating settings sections"
    },
    "used_in": ["settings_tab"]
  },
  "PluginIdInput": {
    "ds_component": "Setting",
    "variants": ["whitelist", "blacklist"],
    "visual_states": {
      "default": "Empty text input with placeholder and Add button",
      "error": "Inline error description text below input (validation_error)"
    },
    "used_in": ["settings_tab"]
  },
  "PluginListContainer": {
    "ds_component": "HTMLDivElement (container)",
    "variants": ["whitelist", "blacklist"],
    "visual_states": {
      "empty": "No entries displayed",
      "populated": "One or more PluginListEntry children rendered"
    },
    "used_in": ["settings_tab"]
  },
  "PluginListEntry": {
    "ds_component": "Setting",
    "variants": [],
    "visual_states": {
      "default": "Plugin ID text displayed with remove button"
    },
    "used_in": ["settings_tab"]
  },
  "NotificationDirectorySetting": {
    "ds_component": "Setting",
    "variants": [],
    "visual_states": {
      "default": "Text input showing current directory path or placeholder"
    },
    "used_in": ["settings_tab"]
  },
  "CompliantIndicatorToggle": {
    "ds_component": "Setting",
    "variants": [],
    "visual_states": {
      "on": "Toggle switch in on position",
      "off": "Toggle switch in off position"
    },
    "used_in": ["settings_tab"]
  },
  "TextComponent": {
    "ds_component": "TextComponent (Obsidian)",
    "variants": [],
    "visual_states": {
      "default": "Empty input with placeholder text",
      "filled": "Input showing user-entered text"
    },
    "used_in": ["settings_tab"]
  },
  "ToggleComponent": {
    "ds_component": "ToggleComponent (Obsidian)",
    "variants": [],
    "visual_states": {
      "on": "Toggle visually active",
      "off": "Toggle visually inactive"
    },
    "used_in": ["settings_tab"]
  },
  "ButtonComponent": {
    "ds_component": "ButtonComponent (Obsidian)",
    "variants": ["cta", "icon-only"],
    "visual_states": {
      "default": "Clickable button with label or icon"
    },
    "used_in": ["settings_tab"]
  }
}
```

## Layout Structure

### Settings Tab

```json
{
  "settings_tab": {
    "layout": "vertical-stack",
    "areas": [
      {
        "name": "whitelist-section",
        "position": "top",
        "sticky": false,
        "scroll": false,
        "layout": "vertical-stack"
      },
      {
        "name": "blacklist-section",
        "position": "center",
        "sticky": false,
        "scroll": false,
        "layout": "vertical-stack"
      },
      {
        "name": "notifications-section",
        "position": "center",
        "sticky": false,
        "scroll": false,
        "layout": null
      },
      {
        "name": "display-section",
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
  "loading": {
    "visible": [],
    "hidden": ["PluginSettingTab"],
    "modified": {}
  },
  "displaying": {
    "visible": [
      "PluginSettingTab",
      "SectionHeading",
      "PluginIdInput",
      "PluginListContainer",
      "NotificationDirectorySetting",
      "CompliantIndicatorToggle"
    ],
    "hidden": [],
    "modified": {}
  },
  "saving": {
    "visible": [
      "PluginSettingTab",
      "SectionHeading",
      "PluginIdInput",
      "PluginListContainer",
      "NotificationDirectorySetting",
      "CompliantIndicatorToggle"
    ],
    "hidden": [],
    "modified": {}
  },
  "closed": {
    "visible": [],
    "hidden": ["PluginSettingTab"],
    "modified": {}
  }
}
```

## Responsive Adaptations

```json
{
  "mobile": {
    "PluginSettingTab": "Full-width vertical layout; Obsidian handles responsive rendering natively",
    "ButtonComponent": "Touch-sized targets (minimum 44x44px) per Obsidian mobile defaults"
  },
  "desktop": {
    "PluginSettingTab": "Standard Obsidian settings panel width within settings modal"
  }
}
```
