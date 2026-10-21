# ds-font-config

Typography and sidebar layout settings for **DeepSeek Harness** (DSH). It adds a **Fonts** page to Settings where the interface, conversation, artifact preview, and monospace text can each use an independent font family, size, and line height. It also adds a General-settings switch that hides the collapsed sidebar rail and puts an expand button at the start of the conversation title bar.

## Features

- Four independent roles: Interface, Conversation, Artifact preview, Monospace.
- Each role configures font family, font size, and line height.
- Changes apply live and are stored in the current browser.
- Empty fields keep the current/theme value instead of forcing an override.
- "Restore defaults" returns to the values below.
- **Hide the collapsed sidebar rail** (on by default): when enabled and the sidebar is collapsed, the 56px left rail and its grid track are removed, and a sidebar button appears at the left of the conversation title bar to reopen it. The switch lives under **Settings → General**.
- The title-bar button is hidden on Desktop platforms that already provide a window-chrome sidebar control.

## Defaults

| Role | Font family | Size | Line height |
|---|---|---|---|
| Interface | `"Lucida Grande", "STHeiti"` | 13px | 1.0 |
| Conversation | `"Lucida Grande", "STHeiti"` | 13px | 1.0 |
| Artifact preview | `"Lucida Grande", "STHeiti"` | 13px | 1.0 |
| Monospace | `Monaco` | 12px | 1.2 |

System fonts are used for the defaults; the plugin falls back to the built-in DSH font stacks when a family is unavailable.

## Install

Install the package directory as a DSH bundle, then open **Settings → Fonts** (typography) or **Settings → General** (collapsed-sidebar rail switch):

```bash
git clone https://github.com/yamyay/ds-font-config.git
```

Use the DSH Plugin Manager / `plugin_manager install_bundle` with the cloned directory as the target. Enable the bundle if it is not already active. A page refresh may be needed after the first install so the browser loads the client module.

## Development

The bundle has no build step:

- `index.js` — Host half (empty; typography and layout state live in the browser half).
- `client.js` — Client half: the settings page, the General-section switch, the title-bar button, and the injected stylesheet / sidebar-track override.
- `cordis.patch.yml` — inserts the bundle row.
- `locale/*.json` — Plugin Manager display metadata.
- `icon.svg` — plugin icon.

Version 0.1.0.
