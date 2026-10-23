# ds-font-config

Typography and sidebar layout settings for **DeepSeek Harness** (DSH). It adds a **UI & Fonts** page to Settings where the interface, conversation, artifact preview, and monospace text can each use an independent font family, size, and line height, and where the right-sidebar terminal gets its own font family and size. The same page has a switch that hides the collapsed sidebar rail and puts an expand button at the start of the conversation title bar.

## Features

- Four local roles: Interface, Conversation, Artifact preview, Monospace. Each configures font family, font size, and line height.
- **Terminal role**: font family and size for the right-sidebar terminal (`xterm`). These are the same Host-backed options as **Settings → General → Terminal font / Terminal size**, so edits here and there stay in sync and survive restarts; the terminal remeasures and refits live.
- Local roles apply live and are stored in the current browser; the terminal role is stored in the DSH settings document.
- Empty fields keep the current/theme value instead of forcing an override.
- "Restore defaults" returns to the values below, including the terminal role.
- **Hide the collapsed sidebar rail** (on by default): when enabled and the sidebar is collapsed, the 56px left rail and its grid track are removed, and a sidebar button appears at the left of the conversation title bar to reopen it. The switch lives at the top of **Settings → UI & Fonts**.
- The title-bar button is hidden on Desktop platforms that already provide a window-chrome sidebar control.

## Defaults

| Role | Font family | Size | Line height |
|---|---|---|---|
| Interface | `"Lucida Grande", "STHeiti"` | 13px | 1.0 |
| Conversation | `"Lucida Grande", "STHeiti"` | 13px | 1.0 |
| Artifact preview | `"Lucida Grande", "STHeiti"` | 13px | 1.0 |
| Monospace | `Monaco` | 12px | 1.2 |
| Terminal | built-in terminal stack (`ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`) | 13px | n/a (xterm owns its row metrics) |

System fonts are used for the defaults; the plugin falls back to the built-in DSH font stacks when a family is unavailable. The terminal always appends that built-in stack after the chosen families.

## Install

Install the package directory as a DSH bundle, then open **Settings → UI & Fonts**:

```bash
git clone https://github.com/yamyay/ds-font-config.git
```

Use the DSH Plugin Manager / `plugin_manager install_bundle` with the cloned directory as the target. Enable the bundle if it is not already active. A page refresh may be needed after the first install so the browser loads the client module.

The terminal role needs a DSH build whose theme service owns the `terminal` font family/size (0.2.1-rc.2 or newer); the local roles work on older builds, but the terminal card would not apply there.

## Development

The bundle has no build step:

- `index.js` — Host half (empty; typography and layout state live in the browser half).
- `client.js` — Client half: the settings page, the sidebar switch, the title-bar button, the injected stylesheet / sidebar-track override, and the terminal role that reads/writes the theme service's terminal font family and size.
- `cordis.patch.yml` — inserts the bundle row.
- `locale/*.json` — Plugin Manager display metadata.
- `icon.svg` — plugin icon.

Version 0.2.0.
