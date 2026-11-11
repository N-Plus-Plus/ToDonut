<!-- Document ceiling: 135 lines; 9,000 characters including metadata. On overflow, apply AGENTS.md decision rule. -->
# Visual style

> Repository instruction precedence: [AGENTS.md](../AGENTS.md) governs this document.

The working visual system is [src/styles.css](../src/styles.css) and shared React primitives. Preserve the dark-only, mostly monochrome foundation; use alignment, type, surface contrast and spacing for hierarchy. Colour is reserved for semantic accents such as Status, Priority, Tags, warnings and selection. Reuse local tokens, accessible Lucide icons and existing controls rather than installing a new framework.

Keep layouts usable on narrow and wide screens, visible focus, keyboard/touch access, text equivalents for colour, and reduced-motion behaviour. Task hierarchy uses shared rows, capped indentation, subtle guides and muted structural ancestors; aggregate rows show derived progress while leaf-only fields remain suppressed. Use the accepted mobile modal viewport behaviour in [user experience](USER_EXPERIENCE.md).

Modal, menu, action, feedback and typography treatments remain those of the working application; shared components should be reused. For future work use cumulative spacing and avoid duplicate dividers. Preserve original visual assets, and create a suitable derivative only when its measured rendered size justifies one. Do not overwrite operational CSS with the archive reference.
