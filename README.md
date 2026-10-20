# ds-font-config

Typography settings for **DeepSeek Harness** (DSH). It adds a **Fonts** page to Settings where the interface, conversation, artifact preview, and monospace text can each use an independent font family, size, and line height.

## Features

- Four independent roles: Interface, Conversation, Artifact preview, Monospace.
- Each role configures font family, font size, and line height.
- Changes apply live and are stored in the current browser.
- Empty fields keep the current/theme value instead of forcing an override.
- "Restore defaults" returns to the values below.

## Defaults

| Role | Font family | Size | Line height |
|---|---|---|---|
| Interface | `"Lucida Grande", "STHeiti"` | 13px | 1.0 |
| Conversation | `"Lucida Grande", "STHeiti"` | 13px | 1.0 |
| Artifact preview | `"Lucida Grande", "STHeiti"` | 13px | 1.0 |
| Monospace | `Monaco` | 12px | 1.2 |

System fonts are used for the defaults; the plugin falls back to the built-in DSH font stacks when a family is unavailable.

## Install

Install the package directory as a DSH bundle, then open **Settings → Fonts**:

```bash
git clone https://github.com/yamyay/ds-font-config.git
```

Use the DSH Plugin Manager / `plugin_manager install_bundle` with the cloned directory as the target. Enable the bundle if it is not already active. A page refresh may be needed after the first install so the browser loads the client module.

## Development

The bundle has no build step:

- `index.js` — Host half (empty; typography lives in the browser half).
- `client.js` — Client half: the settings page and the injected stylesheet.
- `cordis.patch.yml` — inserts the bundle row.
- `locale/*.json` — Plugin Manager display metadata.
- `icon.svg` — plugin icon.

Version 0.1.0.
