# The editor layout — three columns, one model

Design note, 2026-08-09. The editor has grown four surfaces the original Scratch GUI never
had — Code, Circuit, Debugger, and soon a cube renderer — and they are currently bolted on
as extra tabs. That does not scale, and more importantly it is the wrong shape: a tab means
"instead of the workspace", when what people actually want is "beside the workspace".

This note fixes the layout model before any of it is built, because the failure mode here is
not a missing feature. It is an editor that grows a control for everything and becomes a
cockpit.

## The constraint that decides most of this

**The block palette is not a pane.** It is Blockly's flyout, drawn inside the same canvas as
the workspace (`blocks.jsx` → `this.workspace.getFlyout()`). Left and middle are one DOM box
today, and no amount of CSS will separate them.

That is not a reason to abandon the three-column model — it is a reason to state honestly how
each column resizes, because the mechanism differs per column:

| column | what it is | how a size change happens |
|---|---|---|
| left | Blockly's flyout | flyout width, and at the smallest size the category strip alone |
| middle | a DOM slot | flex-basis |
| right | a DOM slot, already split upper/lower | flex-basis; the stage keeps its own aspect rule |

Anyone who tries to implement the left column as a CSS pane will spend a day finding this out.

## One model, stated once

> **Three columns. Each column holds one slot, or two stacked slots. A slot shows one surface.
> Nothing floats, nothing docks, nothing overlaps.**

Surfaces: `palette · workspace · stage · sprites · code · circuit · debugger · costumes ·
sounds`. That is the whole vocabulary. A slot's surface is chosen from **that slot's own
header**, never from a global settings page — the control lives where its effect is visible.

The two-stacked-slots case is not a new idea: the right column already does it (stage above,
sprites below). Generalising it to all three columns costs nothing conceptually and is what
"optionally only upper or lower half" asks for.

## Sizes are relative, and that is the whole trick

Five sizes — `xs · s · m · l · xl` — but they are **shares of the row, not pixel widths**.
One control per column, cycling through them. Enlarging one column shrinks the others, which
is what makes a single click meaningful and why there is no drag handle in the first version.

`xs` is the important one: a column at `xs` is a **vertical title strip** — its name, rotated,
and its surface icon, about 28px wide. Click it and it returns to whatever it was. This is the
"all others become strings" behaviour: pushing one column to `xl` puts the other two into
strips automatically, and no state is lost.

Why not drag handles: a drag handle is a fine *addition* and a terrible *foundation*. It gives
every user an infinity of layouts, of which about four are good, and it makes "put it back"
impossible. Sizes first, handles later for people who want them.

## Presets are what stop it feeling like a cockpit

Most people should never touch a slot menu. Four presets, on the tab row where the tabs are
today:

| preset | left | middle | right |
|---|---|---|---|
| **Blocks** | palette `m` | workspace `l` | stage + sprites `m` |
| **Code** | palette `xs` | code `xl` | stage + sprites `s` |
| **Hardware** | palette `s` | workspace `m` | circuit `l` |
| **Debug** | palette `xs` | workspace `l` | debugger + stage `m` |

A preset sets every slot and every size at once. The per-slot controls remain for people who
want something else, and choosing anything custom simply shows "Custom" in the preset row —
no dialog, no save button, no naming.

**The tab row does not disappear; it becomes the preset row.** Tabs were always a way of
answering "what is in the middle", which is exactly what a preset answers, with two more
columns of context. Costumes and Sounds stay as they are: they are modes, not panes, and
forcing them into this model would be the overload this note exists to avoid.

## Collapsing the chrome

Two rows at the top — menu bar, then tabs. Both collapse into **one 32px strip**: a hamburger
on the left that opens the menu bar as a sheet, the preset name in the middle, and the
existing green flag / stop on the right. Clicking the preset name expands the preset row back.

The rule that keeps this honest: **collapsing never removes a capability, only its
permanence.** Everything reachable in the expanded chrome is reachable in one more click when
collapsed. If something can only be done expanded, it does not belong in the chrome.

## What each piece costs

Ordered so that each step is useful on its own, and none of it is a rewrite:

1. **Chrome collapse** — pure CSS and one boolean. No layout model needed. Ship first.
2. **Size vocabulary on the right column** — it already has `stageSize` with two values;
   widening that to five and moving it into a shared reducer is the smallest real step.
3. **Slot model + the middle column** — one reducer holding `{left, middle, right: [upper,
   lower]}` and their sizes, and the middle slot learning to host `code` / `circuit` /
   `debugger` instead of only the workspace.
4. **Presets** — trivial once (3) exists; it is four constants.
5. **The left column** — Blockly flyout width, last, because it is the only one that needs
   Blockly cooperation and the only one that can be faked convincingly at `xs` (category
   strip) while the rest waits.

## Two things to refuse

**Do not persist the layout in the project.** A project describes a program, not somebody's
window arrangement; a shared project must not rearrange the recipient's editor. Layout goes to
`localStorage`. The one exception worth having is a *suggestion*: opening a project with pins
declared may offer the Hardware preset once, in a toast that can be dismissed forever.

**Do not add a "reset layout" menu item.** If getting back to a good layout needs a menu item,
the presets have failed. Clicking `Blocks` is the reset.
