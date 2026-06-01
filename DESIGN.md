---
name: Yggdrasil Worktree
description: A practical, mythic public design system for the Yggtree CLI website and docs.
colors:
  deep-forest: "#0b1d0b"
  mist-green: "#1a3a1a"
  gold-rune: "#d4a853"
  parchment: "#f5e6d3"
  frost-white: "#e8f0e8"
  cosmic-purple-deep: "#3d2066"
  cosmic-purple-vivid: "#8347d7"
  popover-forest: "#102610"
  sidebar-forest: "#0d230d"
  destructive-red: "#f97373"
  gold-border: "#d4a85338"
  gold-focus: "#d4a8538c"
typography:
  display:
    fontFamily: "Cinzel, Georgia, serif"
    fontSize: "clamp(3rem, 7vw, 5.75rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Cinzel, Georgia, serif"
    fontSize: "clamp(2rem, 1.4vw + 1.55rem, 2.75rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Cinzel, Georgia, serif"
    fontSize: "1.35rem"
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: "-0.005em"
  body:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.gold-rune}"
    textColor: "{colors.deep-forest}"
    rounded: "{rounded.md}"
    padding: "16px 32px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.gold-rune}"
    rounded: "{rounded.md}"
    padding: "16px 32px"
  command-block:
    backgroundColor: "{colors.mist-green}"
    textColor: "{colors.frost-white}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  docs-card:
    backgroundColor: "{colors.mist-green}"
    textColor: "{colors.frost-white}"
    rounded: "{rounded.md}"
    padding: "20px"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.parchment}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "4px 0"
---

# Design System: Yggdrasil Worktree

## 1. Overview

**Creative North Star: "The Living Terminal Grove"**

The Yggdrasil Worktree system feels like a command manual found in a mythic forest workshop: dark, quiet, tactile, and built for repeated use. It gives the public site a distinct identity without making command examples feel theatrical. The tree metaphor is present in color, naming, and atmosphere, while the layout stays practical enough for developers who came to solve a workflow problem.

This system rejects generic SaaS polish, terminal costume, and decorative mythology. Surfaces should feel grown from the same root: deep forest backgrounds, mist-green panels, rare gold emphasis, serif-led voice, and mono command details. Documentation pages can be expressive, but dense references must behave like tools.

**Key Characteristics:**

- Dark forest surfaces with gold used as a scarce signal.
- Serif display and body type, with mono reserved for commands, labels, and control text.
- Tonal layering, borders, and soft glows instead of heavy app shadows.
- Practical command examples placed before exhaustive reference detail.
- Motion that reveals structure without delaying access to content.

## 2. Colors

The palette is a committed dark system: forest greens carry the surface, gold carries attention, parchment carries long-form reading, and purple appears as a supporting glow rather than a dominant brand color.

### Primary

- **Deep Forest**: The body background and main canvas. It anchors the whole site and keeps command surfaces calm.
- **Gold Rune**: The primary accent for links, section labels, borders, focus states, selection, and primary call-to-action states. Use it sparingly so it keeps signal value.

### Secondary

- **Mist Green**: The main surface layer for cards, command blocks, panels, and hover states. It should read as depth inside the forest, not as a separate color theme.
- **Cosmic Purple Deep**: The quiet supporting accent in gradients and terminal output treatments. It is useful for magical atmosphere, but it must not replace gold as the primary signal.
- **Cosmic Purple Vivid**: The Tailwind-facing vivid purple used in some glows and gradients. Keep it soft and partially transparent.

### Tertiary

- **Destructive Red**: Error and destructive action color. It should appear only when the action or state is materially risky.

### Neutral

- **Frost White**: Primary text on dark surfaces and command text inside terminal blocks.
- **Parchment**: Long-form body text, secondary navigation, descriptions, and softer reading surfaces.
- **Popover Forest**: Elevated overlay background for menus, tooltips, or sheets that need separation from the main canvas.
- **Sidebar Forest**: Slightly lifted navigation background.
- **Gold Border**: Transparent gold border treatment for cards, panels, dividers, and sidebar rules.

### Named Rules

**The Scarce Rune Rule.** Gold is the reader's signal color. If every border, heading, and icon is gold, the system loses hierarchy.

**The Forest Before Purple Rule.** Purple supports atmosphere through glows and gradients. It is never the dominant surface, text, or navigation color.

## 3. Typography

**Display Font:** Cinzel, with Georgia as fallback.
**Body Font:** Source Serif 4, with Georgia as fallback.
**Label/Mono Font:** JetBrains Mono, with ui-monospace and SFMono-Regular as fallbacks.

**Character:** The pairing is ceremonial but practical. Cinzel gives the Yggdrasil identity a carved, mythic quality; Source Serif keeps long docs readable; JetBrains Mono marks commands and controls without turning the whole product into a terminal costume.

### Hierarchy

- **Display** (700, `clamp(3rem, 7vw, 5.75rem)`, 0.98): Hero headlines and the strongest page statement only.
- **Headline** (600, `clamp(2rem, 1.4vw + 1.55rem, 2.75rem)`, 1.08): Major documentation sections and page-level section breaks.
- **Title** (600, `1.35rem`, 1.18): Cards, examples, troubleshooting entries, and smaller content groups.
- **Body** (400, `1rem`, 1.65): Long prose, descriptions, notes, and docs explanation. Keep body measure between 65 and 75 characters.
- **Label** (500, `0.8125rem`, normal letter spacing): Command flags, nav labels, terminal captions, metadata, and compact controls.

### Named Rules

**The Mono Means Work Rule.** Mono is reserved for command text, flags, labels, and controls. Do not use it as a lazy shorthand for developer personality.

**The Serif Carries Trust Rule.** Long-form docs use Source Serif 4 with generous line-height. Do not collapse docs prose into cramped UI sans patterns.

## 4. Elevation

The system is mostly flat at rest. Depth comes from tonal layers, transparent gold borders, blur-backed terminal panels, and occasional glow halos. Shadows are not the default material; they appear as soft atmosphere around signature command surfaces and feature cards.

### Shadow Vocabulary

- **Command Glow** (`absolute -inset-0.5`, gradient from gold to purple, blur, 20 percent opacity): Use behind command blocks and terminal-like moments that need visual focus.
- **Feature Hover Glow** (gold to purple, blur, opacity from 0 to 100 percent on hover): Use for feature cards where hover should feel active but not loud.
- **No Heavy Drop Shadow**: The design does not use broad black drop shadows for depth.

### Named Rules

**The Tonal Layer Rule.** A panel should become visible through green surface shifts and gold borders before it uses shadow.

**The Glow Must Earn It Rule.** Glow belongs to terminal, hero, and signature feature moments. It is prohibited as generic card decoration.

## 5. Components

### Buttons

- **Shape:** Gently curved rectangles (8px radius), with full-pill reserved for small badges.
- **Primary:** Gold Rune background with Deep Forest text, usually `16px 32px` on large public CTAs.
- **Hover / Focus:** Hover can invert outline buttons to gold fill. Focus uses the gold focus ring with at least 3px visible ring treatment.
- **Secondary / Ghost / Tertiary:** Ghost buttons use transparent backgrounds, parchment text, and mist-green hover fills. Destructive buttons use red only for materially risky actions.
- **Touch Targets:** Mobile and touch-facing controls must preserve at least a 44px minimum target, even when the visual style is compact.

### Chips

- **Style:** Small pill or compact rounded tag, usually mono, with mist-green or transparent background and gold border.
- **State:** Selected or active states may increase gold opacity, but should not become neon or high-glow.

### Cards / Containers

- **Corner Style:** Cards use 8px to 12px radius. Do not exceed 16px on cards or panels.
- **Background:** Mist Green at partial opacity for content groups, Deep Forest for command reference containers, and Popover Forest for overlays.
- **Shadow Strategy:** Use tonal layering and borders by default. Glow is allowed only on command blocks and signature cards.
- **Border:** Gold Border is the standard container edge.
- **Internal Padding:** Compact reference items use 16px to 20px. Feature cards use 24px.

### Inputs / Fields

- **Style:** Dark green or transparent fill with gold-tinted border, 8px radius, parchment text.
- **Focus:** Gold border plus gold focus ring. The field must remain readable against the dark surface.
- **Error / Disabled:** Error uses Destructive Red. Disabled states reduce opacity but must preserve readable labels.

### Navigation

- **Desktop docs navigation:** Quiet left rail with parchment links and gold hover states. Avoid boxed nav pills unless the state needs to be explicit.
- **Mobile docs navigation:** Sheet from the left with Deep Forest background, gold title, parchment labels, and compact spacing.
- **Top navigation:** Simple links, no heavy button chrome unless the action is primary.

### Command Block

Command blocks are the signature component. They use a mist-green terminal panel, gold and purple glow, mono command text, a small terminal label, and a copy control. Use them for commands the reader should run, not for decorative code snippets.

## 6. Do's and Don'ts

### Do:

- **Do** teach the workflow before the flag list.
- **Do** make safety visible whenever a command can move, copy, apply, or delete work.
- **Do** use Deep Forest, Mist Green, and Parchment as the reading base, with Gold Rune as the scarce signal.
- **Do** keep command examples concrete and runnable.
- **Do** use the Yggdrasil metaphor to add identity, not ambiguity.

### Don't:

- **Don't** create generic SaaS docs pages with interchangeable cards, soft gradients, and vague productivity promises.
- **Don't** use terminal-only hacker aesthetics that make the product feel narrower than the workflow it supports.
- **Don't** add decorative mythology that obscures the actual Git and worktree behavior.
- **Don't** write dense command references that present completeness before the reader has a working mental model.
- **Don't** use border-left or border-right greater than 1px as a colored accent on cards, list items, callouts, or alerts.
- **Don't** pair a 1px border with a soft wide drop shadow on the same card. Use a defined border or a restrained glow, not both as decoration.
