/**
 * Browser half of ds-font-config: one settings section that owns four
 * typography roles (interface, conversation, artifact preview, monospace) and
 * one injected stylesheet that projects the chosen families, sizes, and line
 * heights onto the live page.
 *
 * The defaults below are applied unless the browser stored a previous choice;
 * an explicitly cleared field emits no CSS and keeps whatever the shipped
 * theme/typography settings currently resolve to.
 */
window.__ModuleLoader__.load({
  id: 'ds-font-config',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const ROLES = ['ui', 'chat', 'preview', 'mono']
    const ROLE_LIMITS = {
      ui: { min: 10, max: 22, minLine: 1, maxLine: 2.6 },
      chat: { min: 10, max: 22, minLine: 1, maxLine: 2.6 },
      preview: { min: 9, max: 22, minLine: 1, maxLine: 2.6 },
      mono: { min: 9, max: 20, minLine: 1, maxLine: 2.4 },
    }
    const STORAGE_KEY = 'ds-font-config.v2'
    const LEGACY_STORAGE_KEY = 'ds-font-config.v1'
    const DEFAULT_TEXT_FAMILY = '"Lucida Grande", "STHeiti"'
    const DEFAULT_MONO_FAMILY = '"Monaco"'
    const PREVIEW_SELECTOR = '[data-document-preview], [data-changes-review], [data-changes-hover-preview], [data-presented-file]'

    /** CSS-wide generic family keywords, which must stay unquoted. */
    const GENERIC_FAMILIES = new Set([
      'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-serif', 'ui-sans-serif',
      'ui-monospace', 'ui-rounded', 'emoji', 'math', 'fangsong', '-apple-system', 'blinkmacsystemfont',
    ])

    const DICTIONARIES = {
      zh: {
        nav: '字体',
        title: '字体',
        intro: '默认界面、对话和产物预览为 13px、行距 1.0，等宽为 Monaco 12px、行距 1.2。留空沿用当前设置，修改立即生效并保存在此浏览器。',
        'group.ui.title': '界面',
        'group.ui.desc': '应用外壳、侧栏、设置、菜单与按钮等界面文字。',
        'group.chat.title': '对话',
        'group.chat.desc': '聊天消息、输入框与工具卡片的正文。',
        'group.preview.title': '产物预览',
        'group.preview.desc': '文件预览、变更对比与产物卡片中的正文。',
        'group.mono.title': '等宽',
        'group.mono.desc': '代码块、行内代码、差异对比与纯文本预览。',
        'field.family': '字体族',
        'field.size': '字号',
        'field.lineHeight': '行距',
        'placeholder.family.ui': '留空沿用当前字体',
        'placeholder.family.chat': '留空跟随界面字体',
        'placeholder.family.preview': '留空跟随界面字体',
        'placeholder.family.mono': '留空沿用当前等宽字体',
        preview: '实时预览',
        sample: '字体预览 Aa 0123 — 字号与行距共同决定正文的阅读节奏。The quick brown fox jumps over the lazy dog.',
        saveNote: '设置保存在此浏览器，修改立即生效。',
        reset: '恢复默认',
        unit: 'px',
        lineUnit: '×',
        'sidebarToggle.title': '收起侧栏时隐藏左侧细条',
        'sidebarToggle.desc': '侧栏收起后隐藏左侧栏，只在对话标题栏左侧显示一个展开按钮。',
        'sidebarToggle.open': '展开侧边栏',
      },
      en: {
        nav: 'Fonts',
        title: 'Fonts',
        intro: 'Defaults: 13px at 1.0 line height for the interface, conversation, and artifact preview; Monaco at 12px and 1.2 for monospace. Leave a field empty to keep the current setting. Changes apply immediately and stay in this browser.',
        'group.ui.title': 'Interface',
        'group.ui.desc': 'Shell, sidebar, settings, menus, and button text.',
        'group.chat.title': 'Conversation',
        'group.chat.desc': 'Chat messages, the composer, and tool-card prose.',
        'group.preview.title': 'Artifact preview',
        'group.preview.desc': 'Prose in file previews, change reviews, and presented artifacts.',
        'group.mono.title': 'Monospace',
        'group.mono.desc': 'Code blocks, inline code, diffs, and plain-text previews.',
        'field.family': 'Family',
        'field.size': 'Size',
        'field.lineHeight': 'Line height',
        'placeholder.family.ui': 'Empty keeps the current font',
        'placeholder.family.chat': 'Empty follows the interface font',
        'placeholder.family.preview': 'Empty follows the interface font',
        'placeholder.family.mono': 'Empty keeps the current monospace font',
        preview: 'Live preview',
        sample: 'Font preview Aa 0123 — size and line height shape the reading rhythm. The quick brown fox jumps over the lazy dog.',
        saveNote: 'Saved in this browser and applied immediately.',
        reset: 'Restore defaults',
        unit: 'px',
        lineUnit: '×',
        'sidebarToggle.title': 'Hide the collapsed sidebar rail',
        'sidebarToggle.desc': 'When the sidebar is collapsed, hide the left rail and show an expand button at the start of the conversation title bar.',
        'sidebarToggle.open': 'Expand sidebar',
      },
    }

    const STYLES = `
.fs-section{display:flex;flex-direction:column;gap:12px;max-width:720px;color:var(--dsw-alias-label-primary)}
.fs-title{margin:0;font-size:18px;line-height:26px;font-weight:600}
.fs-intro{margin:0;font-size:13px;line-height:20px;color:var(--dsw-alias-label-tertiary)}
.fs-frame{display:flex;flex-direction:column;margin-top:8px;overflow:hidden;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-xl);background:var(--dsw-alias-bg-module-platform)}
.fs-role{display:flex;flex-direction:column;gap:12px;padding:16px}
.fs-role + .fs-role{border-top:.5px solid var(--dsw-alias-border-l2)}
.fs-cardHead{display:flex;flex-direction:column;gap:4px}
.fs-cardTitle{margin:0;font-size:14px;line-height:22px;font-weight:500;color:var(--dsw-alias-label-primary)}
.fs-cardDesc{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}
.fs-controls{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr) minmax(0,1fr);gap:10px}
.fs-field{display:flex;min-width:0;flex-direction:column;gap:6px}
.fs-label{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.fs-inputShell{display:inline-flex;align-items:center;gap:6px;box-sizing:border-box;width:100%;height:32px;padding:0 8px;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-1)}
.fs-inputShell:focus-within{border-color:var(--dsw-alias-state-business-primary)}
.fs-input{flex:1 1 auto;min-width:0;padding:0;border:none;outline:none;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;line-height:22px}
.fs-input::placeholder{color:var(--dsw-alias-label-dimmed)}
.fs-input:focus-visible{outline:none}
.fs-number{-moz-appearance:textfield;appearance:textfield}
.fs-number::-webkit-inner-spin-button,.fs-number::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.fs-unit{flex:none;font-size:14px;line-height:22px;color:var(--dsw-alias-label-secondary)}
.fs-sample{display:flex;flex-direction:column;gap:6px;padding:10px 12px;border:.5px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-1)}
.fs-sampleTag{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary)}
.fs-sampleText{min-height:2.4em;margin:0;overflow-wrap:anywhere;color:var(--dsw-alias-label-primary)}
.fs-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:2px}
.fs-note{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}
.fs-reset{box-sizing:border-box;height:28px;padding:0 10px;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:18px;cursor:pointer}
.fs-reset:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.fs-reset:disabled{opacity:.4;cursor:not-allowed}
.fs-reset:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}
/* General-section row: hide the collapsed-sidebar rail. */
.rail-row{display:flex;align-items:center;gap:8px;padding:16px 0;border-bottom:.5px solid var(--dsw-alias-border-l2)}
.rail-text{display:flex;flex:1;min-width:0;flex-direction:column;gap:4px;padding-right:48px}
.rail-title{font-size:14px;line-height:22px;color:var(--dsw-alias-label-primary)}
.rail-desc{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}
.rail-switch{box-sizing:border-box;position:relative;flex:0 0 auto;width:36px;height:20px;padding:2px;border:0;border-radius:999px;corner-shape:round;background:var(--dsw-alias-border-l3);cursor:pointer}
.rail-switch[aria-checked='true']{background:var(--dsw-alias-brand-primary)}
.rail-switch:disabled{cursor:default;opacity:.5}
.rail-switch:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}
.rail-thumb{display:block;width:16px;height:16px;border-radius:50%;corner-shape:round;background:var(--dsw-alias-label-primary-foreground);transition:transform 120ms ease}
.rail-switch[aria-checked='false'] .rail-thumb{background:var(--dsw-alias-switch-thumb)}
.rail-switch[aria-checked='true'] .rail-thumb{transform:translateX(16px)}
/* Title-bar expand control, mounted only while the sidebar is collapsed. */
[data-ds-rail-reopen]{display:none}
[data-sidebar-collapsed] [data-ds-rail-reopen]{display:inline-flex}
html[data-platform='darwin'] [data-ds-rail-reopen],html[data-windows-titlebar] [data-ds-rail-reopen]{display:none!important}
.rail-reopen{flex:none;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:none;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.rail-reopen:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.rail-reopen:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}
@media (max-width:720px){.fs-controls{grid-template-columns:1fr}.fs-actions{align-items:flex-start;flex-direction:column}}
`

    function defaultState() {
      return {
        ui: { family: DEFAULT_TEXT_FAMILY, size: 13, lineHeight: 1 },
        chat: { family: DEFAULT_TEXT_FAMILY, size: 13, lineHeight: 1 },
        preview: { family: DEFAULT_TEXT_FAMILY, size: 13, lineHeight: 1 },
        mono: { family: DEFAULT_MONO_FAMILY, size: 12, lineHeight: 1.2 },
        hideCollapsedRail: true,
      }
    }

    /**
     * Normalize a comma-separated family list exactly like the shipped theme
     * settings: drop quotes/backslashes/angle brackets/control characters,
     * collapse whitespace, and quote every non-generic name.
     */
    function normalizeFamily(value) {
      return String(value)
        .split(',')
        .map(name => name.replace(/["'\\<>\u0000-\u001f\u007f]/gu, '').replace(/\s+/gu, ' ').trim())
        .filter(name => name !== '')
        .map(name => (GENERIC_FAMILIES.has(name.toLowerCase()) ? name : `"${name}"`))
        .join(', ')
    }

    function clampSize(role, value) {
      if (value === null || value === undefined || value === '') return null
      const parsed = Number(value)
      if (!Number.isFinite(parsed)) return null
      const limit = ROLE_LIMITS[role]
      return Math.min(limit.max, Math.max(limit.min, Math.round(parsed)))
    }

    function clampLineHeight(role, value) {
      if (value === null || value === undefined || value === '') return null
      const parsed = Number(value)
      if (!Number.isFinite(parsed)) return null
      const limit = ROLE_LIMITS[role]
      return Math.min(limit.maxLine, Math.max(limit.minLine, Math.round(parsed * 100) / 100))
    }

    function readStored(key) {
      try {
        const raw = JSON.parse(window.localStorage.getItem(key) || 'null')
        return raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? raw : null
      } catch {
        return null
      }
    }

    function applyStored(base, raw, respectEmpty) {
      if (raw === null) return base
      if (typeof raw.hideCollapsedRail === 'boolean') base.hideCollapsedRail = raw.hideCollapsedRail
      for (const role of ROLES) {
        const entry = raw[role]
        if (entry === null || typeof entry !== 'object') continue
        if (typeof entry.family === 'string') {
          const family = normalizeFamily(entry.family)
          if (respectEmpty || family !== '') base[role].family = family
        }
        if (Object.prototype.hasOwnProperty.call(entry, 'size')) {
          const size = clampSize(role, entry.size)
          if (respectEmpty || size !== null) base[role].size = size
        }
        if (Object.prototype.hasOwnProperty.call(entry, 'lineHeight')) {
          const lineHeight = clampLineHeight(role, entry.lineHeight)
          if (respectEmpty || lineHeight !== null) base[role].lineHeight = lineHeight
        }
      }
      return base
    }

    function loadState() {
      const next = defaultState()
      const current = readStored(STORAGE_KEY)
      if (current !== null) return applyStored(next, current, true)
      // Migrate the pre-rename keys and the pre-defaults schema. Explicit
      // non-empty values are preserved; empty values fall back to the defaults.
      for (const [key, respectEmpty] of [
        [LEGACY_STORAGE_KEY, false],
        ['dsh-font-studio.v2', true],
        ['dsh-font-studio.v1', false],
      ]) {
        const stored = readStored(key)
        if (stored === null) continue
        const migrated = applyStored(next, stored, respectEmpty)
        saveState(migrated)
        return migrated
      }
      return next
    }

    function saveState(value) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.assign({ version: 2 }, value)))
      } catch {
        // Private-mode storage failures only cost persistence, not the live override.
      }
    }

    let state = loadState()
    let styleElement
    let pluginCtx
    let headerButtonDispose
    let railObserver
    let railDiscoveryObserver
    let railObservedFrame = null
    let railFrame = null
    let railSidebarCol = null
    let railSavedGrid = ''
    let railAppliedGrid = ''
    let railSyncScheduled = false
    const listeners = new Set()

    function emit() {
      for (const listener of [...listeners]) {
        try {
          listener()
        } catch (error) {
          console.error('ds-font-config listener failed:', error)
        }
      }
    }

    function commitState(next) {
      state = next
      saveState(state)
      applyStyles()
      syncRailFeature()
      emit()
    }

    function setField(role, patch) {
      const entry = Object.assign({}, state[role], patch)
      if (Object.prototype.hasOwnProperty.call(patch, 'family')) entry.family = normalizeFamily(entry.family)
      if (Object.prototype.hasOwnProperty.call(patch, 'size')) entry.size = clampSize(role, entry.size)
      if (Object.prototype.hasOwnProperty.call(patch, 'lineHeight')) entry.lineHeight = clampLineHeight(role, entry.lineHeight)
      commitState(Object.assign({}, state, { [role]: entry }))
    }

    function resetAll() {
      const defaults = defaultState()
      // The font page's reset button must not flip the unrelated sidebar switch.
      commitState(Object.assign({}, defaults, { hideCollapsedRail: state.hideCollapsedRail }))
    }

    function setHideCollapsedRail(value) {
      commitState(Object.assign({}, state, { hideCollapsedRail: value }))
    }

    /** Locate the app frame through the stable right-sidebar column hook. */
    function findAppFrame() {
      if (typeof document === 'undefined' || typeof document.querySelector !== 'function') return null
      const rightbar = document.querySelector('[data-rightbar-col]')
      const frame = rightbar === null ? null : rightbar.parentElement
      if (frame instanceof HTMLElement) return frame
      const collapsed = document.querySelector('[data-sidebar-collapsed]')
      return collapsed instanceof HTMLElement ? collapsed : null
    }

    /** Undo the zero-width override and restore the sidebar column. */
    function restoreRail() {
      if (railFrame !== null && railAppliedGrid !== ''
        && railFrame.style.gridTemplateColumns === railAppliedGrid) {
        railFrame.style.gridTemplateColumns = railSavedGrid
      }
      if (railSidebarCol !== null) railSidebarCol.style.removeProperty('display')
      railFrame = null
      railSidebarCol = null
      railSavedGrid = ''
      railAppliedGrid = ''
    }

    /**
     * Collapse the frame's first grid track to zero while the rail-hidden
     * preference is on. The host writes this track inline as a px value, so the
     * override keeps the centre and right tracks exactly as React computed them.
     */
    function applyRailCollapse() {
      if (typeof document === 'undefined' || typeof document.querySelector !== 'function') return
      if (!state.hideCollapsedRail) return
      const frame = findAppFrame()
      if (frame === null) return
      if (!frame.hasAttribute('data-sidebar-collapsed')) {
        restoreRail()
        return
      }
      const sidebarCol = frame.firstElementChild
      if (!(sidebarCol instanceof HTMLElement)) return
      if (railFrame !== frame) {
        railFrame = frame
        railSidebarCol = sidebarCol
        railSavedGrid = frame.style.gridTemplateColumns
      }
      const current = frame.style.gridTemplateColumns
      // React re-writes the host value after a resize/sidebar-report change;
      // refresh the saved base before applying the zero-width override again.
      if (current !== '' && !current.startsWith('0px') && current !== railAppliedGrid) {
        railSavedGrid = current
      }
      if (railSavedGrid === '') return
      const rest = railSavedGrid.replace(/^\s*\S+\s*/, '')
      const next = `0px ${rest}`
      if (current !== next) frame.style.gridTemplateColumns = next
      railAppliedGrid = next
      if (sidebarCol.style.display !== 'none') sidebarCol.style.display = 'none'
    }

    function attachRailObserver() {
      if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') return
      const frame = findAppFrame()
      if (frame !== null) {
        if (railDiscoveryObserver !== undefined) {
          railDiscoveryObserver.disconnect()
          railDiscoveryObserver = undefined
        }
        if (railObservedFrame === frame) return
        if (railObserver === undefined) railObserver = new MutationObserver(scheduleRailSync)
        railObserver.disconnect()
        railObservedFrame = frame
        railObserver.observe(frame, { attributes: true, attributeFilter: ['style', 'data-sidebar-collapsed'] })
        return
      }
      // Client plugins apply before the frame mounts; discover it when it does.
      if (document.body === null) return
      if (railDiscoveryObserver === undefined) {
        railDiscoveryObserver = new MutationObserver(() => {
          if (findAppFrame() === null) return
          railDiscoveryObserver?.disconnect()
          railDiscoveryObserver = undefined
          attachRailObserver()
          applyRailCollapse()
        })
      }
      railDiscoveryObserver.observe(document.body, { childList: true, subtree: true })
    }

    function scheduleRailSync() {
      if (railSyncScheduled) return
      railSyncScheduled = true
      const run = () => {
        railSyncScheduled = false
        applyRailCollapse()
        attachRailObserver()
      }
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run)
      else run()
    }

    function stopRailObserver() {
      if (railObserver !== undefined) railObserver.disconnect()
      if (railDiscoveryObserver !== undefined) railDiscoveryObserver.disconnect()
      railDiscoveryObserver = undefined
      railObservedFrame = null
      railSyncScheduled = false
    }

    /** Mount/unmount the title-bar button and the grid override together. */
    function syncRailFeature() {
      if (typeof document === 'undefined') return
      if (state.hideCollapsedRail) {
        if (pluginCtx !== undefined && headerButtonDispose === undefined) {
          headerButtonDispose = pluginCtx.slots.inject('conversation.header.leading', () => pluginCtx.slots.register({
            name: 'conversation.header.leading',
            locale: 'ds-font-config',
            inject: () => ({ toggleSidebar: () => { pluginCtx.layout.toggleSidebar() } }),
          }, ReopenButton))
        }
        attachRailObserver()
        applyRailCollapse()
      } else {
        if (headerButtonDispose !== undefined) {
          headerButtonDispose()
          headerButtonDispose = undefined
        }
        stopRailObserver()
        restoreRail()
      }
    }

    function px(value) {
      const rounded = Math.round(value * 100) / 100
      return `${rounded}px`
    }

    function rounded(value) {
      return Math.round(value * 100) / 100
    }

    function uiFamilyStack(list) {
      return `${list}, var(--dsh-font-family-text, var(--dsh-font-family-text-default)), var(--dsh-font-family-text-default)`
    }

    function monoFamilyStack(list) {
      return `${list}, var(--dsh-font-family-code, var(--dsh-font-family-code-default)), var(--dsh-font-family-code-default)`
    }

    /**
     * The shipped type-scale tokens used by chrome and tool surfaces. They are
     * fixed px on body, so an interface size scales both axes, while an
     * interface line height restates the reading-size tokens as size × ratio.
     */
    function typeTokens(size, lineHeight) {
      const scale = (size === null ? 14 : size) / 14
      const token = (name, weight, fontSize, lineHeightBase, reading) => {
        const scaledSize = fontSize * scale
        const scaledLine = lineHeight !== null && reading
          ? scaledSize * lineHeight
          : lineHeightBase * scale
        const weightPart = weight === undefined ? '' : `${weight} `
        return `--${name}:${weightPart}${px(scaledSize)} / ${px(scaledLine)} var(--dsw-font-family) !important;`
      }
      return [
        token('dsw-font-xl-24', 600, 24, 32, false),
        token('dsw-font-l-20', 500, 20, 28, false),
        token('dsw-font-m-18', 500, 16, 28, false),
        token('dsw-font-base-16', undefined, 16, 24, true),
        token('dsw-font-base-strong-16', 500, 16, 24, true),
        token('dsw-font-s-14', undefined, 14, 22, true),
        token('dsw-font-s-strong-14', 500, 14, 22, true),
        token('dsw-font-xs-13', undefined, 13, 20, true),
        token('dsw-font-xs-strong-13', 500, 13, 20, true),
        token('dsw-font-xxs-12', undefined, 12, 18, true),
        token('dsw-font-xxs-strong-12', 500, 12, 18, true),
        token('dsw-font-xxxs-11', undefined, 11, 14, true),
        token('dsw-font-xxxs-strong-11', 500, 11, 14, true),
      ].join('')
    }

    /** Global code typography tokens overridden by a monospace line height. */
    function codeTokens(lineHeight) {
      return [
        `--dsw-font-markdown-code:calc(var(--dsh-code-font-size, 11px) + 1px) / calc((var(--dsh-code-font-size, 11px) + 1px) * ${lineHeight}) var(--ds-font-family-code) !important;`,
        `--dsw-font-markdown-code-block:var(--dsh-code-font-size, 11px) / calc(var(--dsh-code-font-size, 11px) * ${lineHeight}) var(--ds-font-family-code) !important;`,
        `--dsw-font-markdown-code-block-small:var(--dsh-code-font-size, 11px) / calc(var(--dsh-code-font-size, 11px) * ${lineHeight}) var(--ds-font-family-code) !important;`,
      ].join('')
    }

    /**
     * Markdown typography tokens are computed on body, so a scoped size, family,
     * or line height needs its own copies of those declarations; each one reads
     * the scoped custom properties at use time.
     */
    function markdownTokens(lineHeight, monoLineHeight) {
      const size = 'var(--dsh-content-font-size, 14px)'
      const secondary = 'var(--dsh-content-font-size-secondary, 13px)'
      const code = 'var(--dsh-code-font-size, 11px)'
      const h1 = `${size} + 7px`
      const h2 = `${size} + 5px`
      const h3 = `${size} + 4px`
      const inlineCode = `${code} + 1px`
      const proseLine = (expression, offset) => lineHeight === null
        ? `calc(${expression} + ${offset}px)`
        : `calc((${expression}) * ${lineHeight})`
      const codeLine = (expression, offset) => monoLineHeight === null
        ? `calc(${expression} + ${offset}px)`
        : `calc((${expression}) * ${monoLineHeight})`
      return [
        `--dsw-font-markdown-h1:700 calc(${h1}) / ${proseLine(h1, 9)} var(--dsw-font-family);`,
        `--dsw-font-markdown-h2:700 calc(${h2}) / ${proseLine(h2, 9)} var(--dsw-font-family);`,
        `--dsw-font-markdown-h3:700 calc(${h3}) / ${proseLine(h3, 8)} var(--dsw-font-family);`,
        `--dsw-font-markdown-h4:600 ${size} / ${proseLine(size, 10)} var(--dsw-font-family);`,
        `--dsw-font-markdown-base:${size} / ${proseLine(size, 10)} var(--dsw-font-family);`,
        `--dsw-font-markdown-base-strong:600 ${size} / ${proseLine(size, 10)} var(--dsw-font-family);`,
        `--dsw-font-markdown-base-italic:italic ${size} / ${proseLine(size, 10)} var(--dsw-font-family);`,
        `--dsw-font-markdown-base-strong-italic:italic 600 ${size} / ${proseLine(size, 10)} var(--dsw-font-family);`,
        `--dsw-font-markdown-table:${secondary} / ${proseLine(secondary, 9)} var(--dsw-font-family);`,
        `--dsw-font-markdown-table-head:500 ${secondary} / ${proseLine(secondary, 9)} var(--dsw-font-family);`,
        `--dsw-font-markdown-small:12px / ${lineHeight === null ? '20px' : px(12 * lineHeight)} var(--dsw-font-family);`,
        `--dsw-font-markdown-small-strong:600 12px / ${lineHeight === null ? '20px' : px(12 * lineHeight)} var(--dsw-font-family);`,
        `--dsw-font-markdown-small-italic:italic 12px / ${lineHeight === null ? '20px' : px(12 * lineHeight)} var(--dsw-font-family);`,
        `--dsw-font-markdown-small-strong-italic:italic 600 12px / ${lineHeight === null ? '20px' : px(12 * lineHeight)} var(--dsw-font-family);`,
        `--dsw-font-markdown-code:calc(${inlineCode}) / ${codeLine(inlineCode, 7)} var(--ds-font-family-code);`,
        `--dsw-font-markdown-code-block:${code} / ${codeLine(code, 8)} var(--ds-font-family-code);`,
        `--dsw-font-markdown-code-block-small:${code} / ${codeLine(code, 5)} var(--ds-font-family-code);`,
        '--dsw-font-markdown-code-font-family:var(--ds-font-family-code);',
      ].join('')
    }

    function scopedRule(selector, settings, monoLineHeight, inheritedLineHeight) {
      const lineHeight = settings.lineHeight === null ? inheritedLineHeight : settings.lineHeight
      const touched = settings.family !== '' || settings.size !== null || lineHeight !== null
      if (!touched) return ''
      const declarations = []
      const family = settings.family === ''
        ? 'var(--dsg-ui-family)'
        : `${settings.family}, var(--dsg-ui-family)`
      declarations.push(`--dsw-font-family:${family};`)
      if (settings.size !== null) {
        const size = settings.size
        const secondary = Math.min(size - 1, Math.max(13, size - 2))
        declarations.push(`--dsh-content-font-size:${size}px;`)
        declarations.push(`--dsh-content-font-size-secondary:${secondary}px;`)
        declarations.push(`--dsh-content-font-delta:${size - 14}px;`)
        declarations.push(`--dsh-content-font-delta-secondary:${secondary - 13}px;`)
      }
      if (lineHeight !== null) declarations.push(`line-height:${lineHeight};`)
      declarations.push(markdownTokens(lineHeight, monoLineHeight))
      const block = `${selector}{${declarations.join('')}}`
      if (lineHeight === null) return block
      const text = ':is(' + selector + ') :where(p, li, blockquote, dd, dt, td, th) { line-height: ' + lineHeight + '; }'
      return `${block}\n${text}`
    }

    function buildCss(value) {
      const chunks = ['html body{--dsg-ui-family:var(--dsw-font-family) !important;}']
      if (value.ui.family !== '') {
        chunks.push(`html body{--dsw-font-family:${uiFamilyStack(value.ui.family)} !important;--dsg-ui-family:var(--dsw-font-family) !important;}`)
      }
      if (value.ui.size !== null) {
        chunks.push(`html body{font-size:${value.ui.size}px !important;--dsh-content-font-size:${value.ui.size}px !important;}`)
      }
      if (value.ui.lineHeight !== null) {
        chunks.push(`html body{line-height:${value.ui.lineHeight} !important;}`)
      }
      if (value.ui.size !== null || value.ui.lineHeight !== null) {
        chunks.push(`html body{${typeTokens(value.ui.size, value.ui.lineHeight)}}`)
      }
      if (value.mono.family !== '') {
        const mono = monoFamilyStack(value.mono.family)
        chunks.push(`html body{--dsw-font-mono:${mono} !important;--ds-font-family-code:${mono} !important;--dsh-font-family-code:${value.mono.family}, var(--dsh-font-family-code-default) !important;}`)
      }
      if (value.mono.size !== null) {
        chunks.push(`html body{--dsh-code-font-size:${value.mono.size}px !important;}`)
      }
      if (value.mono.lineHeight !== null) {
        chunks.push(`html body{--dsg-mono-line-height:${value.mono.lineHeight};${codeTokens(value.mono.lineHeight)}}`)
      }
      const chat = scopedRule('[data-conversation-content]', value.chat, value.mono.lineHeight, value.ui.lineHeight)
      if (chat !== '') chunks.push(chat)
      const preview = scopedRule(PREVIEW_SELECTOR, value.preview, value.mono.lineHeight, value.ui.lineHeight)
      if (preview !== '') chunks.push(preview)
      return chunks.join('\n')
    }

    function applyStyles() {
      if (typeof document === 'undefined') return
      if (styleElement === undefined) {
        styleElement = document.createElement('style')
        styleElement.dataset.fontStudio = ''
        document.head.append(styleElement)
      }
      styleElement.textContent = STYLES + '\n' + buildCss(state)
      // Theme sheets are installed from their own plugin after boot; moving our
      // tag to the end keeps equal-specificity body rules winning after a change.
      document.head.append(styleElement)
    }

    function effectiveValues() {
      const fallback = {
        ui: { size: 14, line: 1.7 },
        chat: { size: 14, line: rounded((14 + 10) / 14) },
        preview: { size: 13, line: rounded((13 + 10) / 13) },
        mono: { size: 11, line: rounded((11 + 8) / 11) },
      }
      if (typeof document === 'undefined' || document.body === null) return fallback
      const computed = window.getComputedStyle(document.body)
      const read = (name, fallbackValue) => {
        const parsed = Number.parseFloat(computed.getPropertyValue(name))
        return Number.isFinite(parsed) ? parsed : fallbackValue
      }
      const contentSize = read('--dsh-content-font-size', 14)
      const secondary = read('--dsh-content-font-size-secondary', 13)
      const codeSize = read('--dsh-code-font-size', 11)
      const bodySize = Number.parseFloat(computed.fontSize) || contentSize
      const bodyLine = Number.parseFloat(computed.lineHeight)
      const uiLine = Number.isFinite(bodyLine) && bodySize > 0 ? bodyLine / bodySize : 1.7
      const chatSize = state.chat.size === null ? contentSize : state.chat.size
      const previewSize = state.preview.size === null ? secondary : state.preview.size
      const monoSize = state.mono.size === null ? codeSize : state.mono.size
      return {
        ui: { size: contentSize, line: rounded(uiLine) },
        chat: { size: chatSize, line: state.chat.lineHeight === null ? (state.ui.lineHeight === null ? rounded((chatSize + 10) / chatSize) : state.ui.lineHeight) : state.chat.lineHeight },
        preview: { size: previewSize, line: state.preview.lineHeight === null ? (state.ui.lineHeight === null ? rounded((previewSize + 10) / previewSize) : state.ui.lineHeight) : state.preview.lineHeight },
        mono: { size: monoSize, line: state.mono.lineHeight === null ? rounded((monoSize + 8) / monoSize) : state.mono.lineHeight },
      }
    }

    function FamilyInput({ role, value, placeholder, onCommit }) {
      return h('span', { className: 'fs-inputShell' },
        h('input', {
          id: `fs-${role}-family`,
          className: 'fs-input',
          type: 'text',
          defaultValue: value,
          placeholder,
          spellCheck: false,
          autoComplete: 'off',
          maxLength: 200,
          onBlur: (event) => {
            const normalized = normalizeFamily(event.currentTarget.value)
            event.currentTarget.value = normalized
            onCommit(normalized)
          },
          onKeyDown: (event) => {
            // oxlint-disable-next-line -- some IMEs report composition only through keyCode 229.
            if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return
            if (event.key === 'Enter') event.currentTarget.blur()
          },
        }),
      )
    }

    function NumberInput({ id, value, placeholder, min, max, step, onCommit, integer, unit }) {
      return h('span', { className: 'fs-inputShell' },
        h('input', {
          id,
          className: 'fs-input fs-number',
          type: 'number',
          min,
          max,
          step,
          inputMode: integer === true ? 'numeric' : 'decimal',
          defaultValue: value === null ? '' : String(value),
          placeholder,
          onBlur: (event) => {
            const raw = event.currentTarget.value.trim()
            onCommit(raw === '' ? null : Number(raw))
          },
          onKeyDown: (event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
          },
        }),
        h('span', { className: 'fs-unit' }, unit),
      )
    }

    function RoleCard({ role, t, settings, effective, onFamily, onSize, onLineHeight }) {
      const limits = ROLE_LIMITS[role]
      const sampleStyle = {}
      if (role === 'mono') {
        sampleStyle.fontFamily = settings.family === ''
          ? 'var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)'
          : settings.family
      } else if (settings.family !== '') {
        sampleStyle.fontFamily = settings.family
      }
      sampleStyle.fontSize = `${settings.size === null ? effective.size : settings.size}px`
      sampleStyle.lineHeight = settings.lineHeight === null ? effective.line : settings.lineHeight
      return h('article', { className: 'fs-role', 'data-font-role': role },
        h('div', { className: 'fs-cardHead' },
          h('h3', { className: 'fs-cardTitle' }, t(`group.${role}.title`)),
          h('p', { className: 'fs-cardDesc' }, t(`group.${role}.desc`)),
        ),
        h('div', { className: 'fs-controls' },
          h('label', { className: 'fs-field', htmlFor: `fs-${role}-family` },
            h('span', { className: 'fs-label' }, t('field.family')),
            h(FamilyInput, {
              key: `family-${role}-${settings.family}`,
              role,
              value: settings.family,
              placeholder: t(`placeholder.family.${role}`),
              onCommit: onFamily,
            }),
          ),
          h('label', { className: 'fs-field', htmlFor: `fs-${role}-size` },
            h('span', { className: 'fs-label' }, t('field.size')),
            h(NumberInput, {
              key: `size-${role}-${settings.size === null ? 'auto' : settings.size}`,
              id: `fs-${role}-size`,
              value: settings.size,
              placeholder: String(effective.size),
              min: limits.min,
              max: limits.max,
              step: 1,
              integer: true,
              unit: t('unit'),
              onCommit: onSize,
            }),
          ),
          h('label', { className: 'fs-field', htmlFor: `fs-${role}-line` },
            h('span', { className: 'fs-label' }, t('field.lineHeight')),
            h(NumberInput, {
              key: `line-${role}-${settings.lineHeight === null ? 'auto' : settings.lineHeight}`,
              id: `fs-${role}-line`,
              value: settings.lineHeight,
              placeholder: effective.line.toFixed(2),
              min: limits.minLine,
              max: limits.maxLine,
              step: 0.05,
              integer: false,
              unit: t('lineUnit'),
              onCommit: onLineHeight,
            }),
          ),
        ),
        h('div', { className: 'fs-sample' },
          h('span', { className: 'fs-sampleTag' }, t('preview')),
          h('p', { className: 'fs-sampleText', style: sampleStyle }, t('sample')),
        ),
      )
    }

    function useHideCollapsedRail() {
      const [enabled, setEnabled] = React.useState(state.hideCollapsedRail)
      React.useEffect(() => {
        const listener = () => { setEnabled(state.hideCollapsedRail) }
        listeners.add(listener)
        return () => { listeners.delete(listener) }
      }, [])
      return enabled
    }

    function SidebarGlyph() {
      return h('svg', {
        width: 16,
        height: 16,
        viewBox: '0 0 16 16',
        fill: 'none',
        'aria-hidden': true,
      },
        h('rect', {
          x: 2, y: 2.5, width: 12, height: 11, rx: 2,
          stroke: 'currentColor', strokeWidth: 1.3,
        }),
        h('path', {
          d: 'M6 2.5v11',
          stroke: 'currentColor', strokeWidth: 1.3,
        }),
      )
    }

    function ReopenButton({ t = key => key, toggleSidebar }) {
      const enabled = useHideCollapsedRail()
      if (!enabled) return null
      const label = t('sidebarToggle.open')
      return h('button', {
        type: 'button',
        className: 'rail-reopen',
        'data-ds-rail-reopen': '',
        'aria-label': label,
        title: label,
        onClick: toggleSidebar,
      }, h(SidebarGlyph))
    }

    function SidebarRailRow({ t = key => key }) {
      const enabled = useHideCollapsedRail()
      return h('div', { className: 'rail-row' },
        h('div', { className: 'rail-text' },
          h('div', { className: 'rail-title' }, t('sidebarToggle.title')),
          h('div', { className: 'rail-desc' }, t('sidebarToggle.desc')),
        ),
        h('button', {
          type: 'button',
          role: 'switch',
          className: 'rail-switch',
          'aria-checked': enabled,
          'aria-label': t('sidebarToggle.title'),
          onClick: () => { setHideCollapsedRail(!enabled) },
        }, h('span', { className: 'rail-thumb' })),
      )
    }

    function FontsSection({ t = key => key }) {
      const [snapshot, setSnapshot] = React.useState(state)
      React.useEffect(() => {
        const listener = () => { setSnapshot(state) }
        listeners.add(listener)
        return () => { listeners.delete(listener) }
      }, [])
      const effective = effectiveValues()
      const defaults = defaultState()
      const pristine = ROLES.every(role => snapshot[role].family === defaults[role].family
        && snapshot[role].size === defaults[role].size
        && snapshot[role].lineHeight === defaults[role].lineHeight)
      return h('section', { className: 'fs-section' },
        h('h2', { className: 'fs-title' }, t('title')),
        h('p', { className: 'fs-intro' }, t('intro')),
        h('div', { className: 'fs-frame' }, ROLES.map(role => h(RoleCard, {
          key: role,
          role,
          t,
          settings: snapshot[role],
          effective: effective[role],
          onFamily: value => { setField(role, { family: value }) },
          onSize: value => { setField(role, { size: value }) },
          onLineHeight: value => { setField(role, { lineHeight: value }) },
        }))),
        h('div', { className: 'fs-actions' },
          h('span', { className: 'fs-note' }, t('saveNote')),
          h('button', {
            type: 'button',
            className: 'fs-reset',
            disabled: pristine,
            onClick: resetAll,
          }, t('reset')),
        ),
      )
    }

    return {
      inject: ['slots', 'locale', 'layout'],
      apply(ctx) {
        pluginCtx = ctx
        ctx.effect(() => {
          try {
            return ctx.locale.register('ds-font-config', DICTIONARIES)
          } catch (error) {
            // A hot-reloaded generation can meet a namespace the previous one
            // has not released yet; the existing dictionaries are equivalent.
            console.warn('ds-font-config locale registration skipped:', error)
            return () => {}
          }
        })
        ctx.effect(() => () => {
          if (styleElement !== undefined) {
            styleElement.remove()
            styleElement = undefined
          }
        })
        ctx.effect(() => () => {
          stopRailObserver()
          restoreRail()
          if (headerButtonDispose !== undefined) {
            headerButtonDispose()
            headerButtonDispose = undefined
          }
        })
        applyStyles()
        syncRailFeature()
        ctx.slots.inject('settings.general.item', () => ctx.slots.register({
          name: 'settings.general.item',
          id: 'ds-font-config-sidebar',
          order: 13,
          locale: 'ds-font-config',
        }, SidebarRailRow))
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'ds-font-config',
          order: 5,
          label: () => ctx.locale.bind('ds-font-config')('nav'),
          locale: 'ds-font-config',
        }, FontsSection))
      },
    }
  },
})
