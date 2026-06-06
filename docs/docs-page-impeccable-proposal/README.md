# Yggtree Docs Page Proposal

## Purpose

This is a proposal for the public Yggtree docs page. It does not replace the live page yet.

The task asks for a critique and three variant prototypes before closing the Notion ticket. The goal is to decide how much of the current mythic visual language should remain while making the page feel more useful, calmer, and less theatrical.

## Reader

The primary reader is a developer who needs to start or resume work in a separate Git worktree without disturbing the checkout they are already using. They may be curious about the brand, but they are mostly trying to answer:

- What should I install?
- Which workflow matches my situation?
- What command should I run first?
- What is safe, risky, or reversible?

## Current Critique

The current page has a good information shape. It starts with install, then moves through common workflows, agent usage, create, checkout, open tools, sandboxes, command reference, configuration, safety, and troubleshooting. That reader journey is worth keeping.

The visual layer is where the page feels close to crossing the line:

- The Yggdrasil metaphor is present in too many places at once: serif drama, gold accents, glow treatments, parchment copy, forest panels, and ritual-adjacent language.
- Repeated gold labels and borders flatten the hierarchy. Gold should mean "look here" rather than "this is another section."
- Several example blocks use similar panel treatments, so the page can feel like a long sequence of themed containers instead of a guided manual.
- The docs page still asks the brand system to carry too much. The product purpose is practical: protect context, create isolated worktrees, and help developers get back to work.
- The current copy is mostly clear, but some lines still lean metaphorical when concrete workflow language would do more for trust.

## Impeccable Lens

### Delight

Delight should sit in specific, useful moments:

- A branch-map visual that helps readers choose between `create`, `wc`, and `create-sandbox`.
- Copy controls and command examples that feel precise and satisfying.
- Small hover states on workflow choices, not decorative atmosphere on every panel.
- A subtle "safety path" motif around sandbox/apply/delete flows.

Delight should not be a constant mythic overlay. If the reader notices the theme more than the workflow, the page is too loud.

### Clarify

The page should make the first decision obvious:

- "Starting planned work" maps to `yggtree create`.
- "Jumping to an existing branch" maps to `yggtree wc`.
- "Trying risky changes" maps to `yggtree create-sandbox`.

Each major section should answer one question before introducing flags. Command reference can stay complete, but it should come after the reader has a mental model.

## Prototype Variants

Open [prototypes.html](./prototypes.html) to compare the three directions.

### Variant A: Refined Grove

Constraint: preserve the current brand and layout direction, but make it less heavy.

Recommended if we want the lowest-risk production change. It keeps the dark forest, Cinzel/Source Serif tone, and current content sequence. It reduces glow, removes side-accent panel habits, makes gold scarcer, and turns the top of the page into a calmer docs entry.

Best changes to carry into production:

- Keep install and first workflow visible above the fold.
- Replace repeated gold section labels with clearer headings and fewer signals.
- Use full-border grouped examples rather than left-accent panels.
- Make safety guidance visually distinct without making it decorative.

### Variant B: Field Manual

Constraint: less mythic, more practical.

Recommended if the docs page should feel like a tool surface first. It keeps the brand palette but pushes the docs toward a field manual: crisp workflow chooser, dense command rows, fewer atmospheric effects, and faster scanning.

Best changes to carry into production:

- Put the three primary workflows in a compact "choose your path" area.
- Use command rows and short notes instead of large repeated cards.
- Keep one expressive header, then let the rest behave like documentation.
- Make the sidebar and command reference feel utilitarian.

### Variant C: Branch Map

Constraint: freer redesign.

Recommended if the site should lean into a distinctive public identity without becoming theatrical. It uses a branch-map visual as the page's main organizing idea. The mythic metaphor becomes structural: branches represent decisions, not decoration.

Best changes to carry into production:

- Replace the generic docs hero with a workflow map.
- Make `create`, `wc`, and `create-sandbox` the page's first interactive-looking choices.
- Tie safety, agents, and command reference back to the branch map.
- Use color by job: green for stable work, gold for primary action, purple only for background depth.

## Recommendation

Start with Variant A for the next implementation pass, and selectively borrow Variant B's compact workflow chooser.

That gives the page a clear improvement path without throwing away the current design system. Variant C is worth keeping as a later redesign direction if the public site needs a more memorable launch experience, but it is a larger change.

## Implementation Notes For The Next Pass

- Update `apps/site/app/docs/page.tsx`.
- Keep the current content arrays where possible, but change the rendering structure.
- Remove `border-l` example panels from docs content.
- Reduce glow usage to command blocks or one signature workflow visual.
- Tighten copy around workflow decisions before command flags.
- Validate with `npx tsc --noEmit`, `pnpm test:typecheck`, and the site build or lint checks available in the app.
