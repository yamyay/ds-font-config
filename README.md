# ds-font-config

Typography and sidebar layout settings for **DeepSeek Harness** (DSH). It adds a **UI & Fonts** page to Settings where the interface, conversation, artifact preview, and monospace text can each use an independent font family, size, and line height, and where the right-sidebar terminal gets its own font family and size. The same page has a switch that hides the collapsed sidebar rail and puts an expand button at the start of the conversation title bar.

## Features

- Four local roles: Interface, Conversation, Artifact preview, Monospace. Each configures font family, font size, and line height.
- **Terminal role**: font family and size for the right-sidebar terminal (`xterm`). These are the same Host-backed options as **Settings → General → Terminal font / Terminal size**, so edits here and there stay in sync and survive restarts; the terminal remeasures and refits live.
- Local roles apply live and are stored in the current browser; the terminal role is stored in the DSH settings document.
- Empty fields keep the current/theme value instead of forcing an override.
- "Restore defaults" returns to the values below, including the terminal role.
- **Hide the collapsed sidebar rail** (on by default): when enabled and the sidebar is collapsed, the 56px left rail and its grid track are removed, and a sidebar button appears at the left of the conversation title bar to reopen it. The switch lives at the top of **Settings → UI & Fonts**.
- The title-bar button is hidden on Desktop platforms that already provide a window-chrome sidebar control, and in drawer mode (viewport below the 768px sidebar-drawer breakpoint): there the frame shows its own opener in the shell-leading seat, so a second stacked button would duplicate it.
- **Expand draft**: a control between the "+" button and the permission select (or right after "+" when the hero draft has no permission picker) grows the draft card to the conversation viewport. While expanded, plain Enter inserts a line break regardless of the composer's Enter preference, and only the send control submits; the control turns into a shrink icon that restores the original height and Enter behavior without touching the draft text; submitting a prompt restores the docked draft automatically.
- **OpenCode Go usage readout**: the sidebar-foot account trigger swaps its "…" glyph for a gear and, while an OpenCode Go model is selected, puts the account's three windows in place of its caption — `5h:12% w:34% m:56%`. The readout refreshes once the conversation settles after a turn, and a click on the trigger also refreshes it. The numbers come from `GET https://opencode.ai/zen/go/v1/usage` through a Host route, because the API key must stay on the Host; the read is fire-and-forget, so no message waits on it, and a failed read keeps the last numbers instead of blanking the trigger.

- **Reduced sidebar navigation**: only the seats the layout keeps stay in the sidebar — the brand row and its new-session action, the fixed automation row, and the workspace list. The full-width new-session card is hidden (the brand row already opens one). The panels nav rows (plugins, and the More launcher that only existed to reach them) are hidden; the plugins entry reappears as a row in the sidebar-foot menu below, so the panels page stays reachable.

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

- `index.js` — Host half: the OpenCode Go usage bridge at `GET /api/ds-font-config/opencode-usage`, behind the composition's connection fence.
- `client.js` — Client half: the settings page, the sidebar switch, the title-bar button, the injected stylesheet / sidebar-track override, the terminal role that reads/writes the theme service's terminal font family and size, the gear mark on the sidebar-foot account trigger, and the usage readout that trigger carries.
- `cordis.patch.yml` — inserts the bundle row.
- `locale/*.json` — Plugin Manager display metadata.
- `icon.svg` — plugin icon.

The readout resolves `OPENCODE_GO_API_KEY` from the credential seam, so it works only on a profile whose `llm-pi-ai` route points at OpenCode Go; without the key the route answers `{ usage: null }` and the trigger stays a bare gear.

Version 0.5.1 — 2026-11-08: the More launcher comes back when the nav has no other panel row, so an entry the user unpinned can still be pinned again from its menu.

Version 0.5.0 — 2026-11-08: the sidebar keeps only the brand row, the fixed automation row, and the workspace list; the full-width new-session card is hidden, and the panels nav rows move into the sidebar-foot menu, which gains a Plugins row.

Version 0.4.0 — 2026-11-08: the sidebar-foot account trigger uses a gear mark instead of the ellipsis, and carries the OpenCode Go usage readout (`5h`/`w`/`m`) in place of its caption while an OpenCode Go model is selected. The readout reloads once after each turn settles and on a click on the trigger; a Host route bridges the API key so the browser never sees it.

Version 0.3.1 — 2026-11-08: an expanded draft also docks again after the Ctrl/Cmd+Enter submit shortcut.

Version 0.3.0 — 2026-11-08: added the expand-draft control between "+" and the permission select; expanded drafts break on Enter and submit only through the send control.

Version 0.2.2 — 2026-11-08: the rail-collapse sync falls back to a timer when `requestAnimationFrame` does not run (hidden or background tab), so collapsing there no longer leaves the rail visible; injected font stacks read each host font token once, so the monospace list and scoped overrides no longer repeat families.

Version 0.2.1 — 2026-11-07: the rail-hiding title-bar button no longer renders in drawer mode, where the native opener already provides the toggle; the rail-collapse grid override also stays off on drawer frames.
