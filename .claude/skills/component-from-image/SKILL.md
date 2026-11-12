---
name: component-from-image
description: Build Pega Constellation DX components (Field, Template or Widget) from a screenshot, mockup or wireframe of a screen. Reads the image, decides which parts need a custom component and which Pega already provides, drafts a generator spec for each, has the person review the plan, generates, implements, then photographs the Storybook stories and compares them with the image. Use when someone shares or names an image and asks for a component from it ("build this", "make a DX component like this mockup", a pasted screen design), or invokes /component-from-image.
---

# Component from an image

The image is a picture. The generator only understands specs. This skill is the
step between: read the picture, write a spec a person can check, and let the
deterministic tools do the rest. Then photograph the result and compare it with
the picture.

Load `new-dx-component` (the generate, implement and check workflow this skill
feeds), `pega-dx-contract` (the rules per type) and, before writing anything
that talks to the platform, `platform-facade`.
`references/visual-mapping.md` maps what you see to spec choices; read it for
step 3.

## 1. Get the image and keep it

- **A file path**: read it. Copy it to
  `tools/generator/specs/images/<kebab-name>.<ext>` so the spec can point at it
  and the comparison in step 7 has a source. Keep the original extension.
- **Pasted into the chat**: you can see it but cannot save it. Ask for a file
  path if they have one. If not, carry on, and write a detailed description of
  the image into the spec's header comment instead; that description is then
  the source for step 7.
- **Several images** (states, or screens of a flow): keep all of them, named by
  what each shows (`-empty`, `-error`, `-readonly`). Different states of one
  component are one component with several stories, not several components.

## 2. Inventory what is on the screen

Before deciding anything, list what is visible, top to bottom, left to right:
every label and its exact text, every control and its shape (text box,
dropdown, toggle, stars, table, card, tabs, button, chart, map), groupings and
columns, sample values, and states shown (required marker, error message,
empty table, read-only text, disabled). Note what the picture **cannot** tell
you: the Pega property behind a field, the data page behind a list, which
values an author should be able to configure, and what happens on click.

Write the inventory down; it goes into the spec header and is what you compare
against in step 7.

## 3. Split the screen: what needs a component at all

A screen in Constellation is mostly configuration. Pega already renders
standard fields, standard layouts and standard widgets, and authors arrange
them in App Studio without code. Building a DX component for any of those adds
code to maintain and loses platform features. So sort every item into one of:

| Bucket              | Meaning                                                          | What to do                     |
| ------------------- | ---------------------------------------------------------------- | ------------------------------ |
| **Standard**        | A stock Constellation field, layout or widget renders it         | Name it in the report; no code |
| **Custom Field**    | One value, shown or edited in a way the stock field types cannot | A Field spec                   |
| **Custom Template** | An arrangement of other fields the stock layouts cannot make     | A Template spec                |
| **Custom Widget**   | A self-contained panel with its own data or actions              | A Widget spec                  |

`references/visual-mapping.md` lists what counts as standard. When unsure,
say so in the report rather than building it: "this looks like the stock
Dropdown; build a custom one only if it must look like the mockup exactly."
Check the existing gallery as well (`ls src/components`): if a component
already does it, propose using or extending it.

## 4. Draft one spec per custom item

For each custom item, choose the type with `new-dx-component` step 1, then map
what you saw onto the spec with `references/visual-mapping.md`. Write the spec
to `tools/generator/specs/<kebab-name>.<field|template|widget>.ts`, with a
header comment in this shape:

```ts
/**
 * <Label>, from tools/generator/specs/images/<file>.png
 *
 * Seen: <the inventory lines for this item: labels, controls, states, sample values>
 * Assumed: <every choice the image did not settle, one per line>
 * Not covered by the generator: <what step 6 must hand-write, e.g. star icons, colour bands>
 */
```

**Settle every setting now.** Anything the author may need to change (a
currency, a unit, a limit) becomes a `p.*` property in this step. Adding one
after step 6 means regenerating with `--force`, which overwrites the code you
wrote by hand.

**Never invent what the image cannot show.** Property names, data page names
and data page parameters come from the person, or are placeholders listed
under _Assumed_. A visible option list becomes `p.select` choices only when the
author must be able to change it; a fixed list of values belongs to the Pega
property (see the Picklist note in `pega-dx-contract`).

## 5. Show the plan and stop

Run the plan for every spec; it writes nothing:

```bash
npm run generate -- tools/generator/specs/<file>.ts --plan
```

Show the person, in one message:

1. The split from step 3: what is standard (no code), what will be built, of which type.
2. Each plan output.
3. The _Assumed_ lines, as questions where the answer changes the spec.
4. What the generator will not do, which you will hand-write in step 6.

**Wait for their go-ahead.** This is the review gate; a wrong spec is cheap to
fix here and expensive after step 6. Apply their corrections to the spec and
re-run `--plan` if anything changed.

## 6. Generate and implement

Follow `new-dx-component` steps 3 and 4. Then make it look like the image:

- **Make a story out of the image.** Set the generated story's args, and for
  a widget the sample `rows` at the top of `demo.stories.tsx`, to the image's
  labels and sample values. Each property's default is already in the args;
  change it there rather than adding it again. Add one story for each state
  the images show. The comparison in step 7 is only fair when the story shows
  the same content as the image. Then update the generated test, which checks
  the placeholder rows.
- **Structure, text and order must match. Pixels need not.** Build with Cosmos
  components and theme tokens. A colour in a mockup maps to the nearest
  semantic token (`theme.base.palette.success`, `.urgent`, `.interactive`,
  …), never to a hex code in `styles.ts`; fonts and spacing come from the theme.
  A mockup drawn in another design system will not match pixel for pixel,
  and should not.
- Work through each "Not covered by the generator" line from the spec header and
  each TODO from the plan. Extend the generated test for every behaviour you
  add.

## 7. Photograph and compare

```bash
npm run snapshot -- <Name>
```

This starts Storybook if it is not running, photographs each story to
`.snapshots/Pega_Extensions_<Name>/<story-id>.png` and prints any error a story
throws. `--full` keeps the whole page (for popovers and modals); `--theme
<name>` picks a Cosmos theme; `--width` sets the viewport (default 1280).

Read the source image and each picture, and list the differences under these
headings, in order of importance:

1. **Missing or extra elements**: a control, a column or a region in one and not the other.
2. **Text**: labels, headings, column titles, button captions, sample values.
3. **Order and grouping**: what sits next to what; columns and rows.
4. **States**: required markers, errors, empty and read-only views.
5. **Look**: sizes, emphasis, alignment. Leave theme differences alone (step 6).

Fix 1 to 4, re-run the snapshot and compare again. Stop after three rounds and
report what is left and why. A difference you chose not to fix (a theme
colour, say) is reported as a decision, not hidden.

## 8. Check and report

Run every check in `new-dx-component` step 5, including Pega's build. Report:

- the split (standard vs built), with the spec, folder and type of each built item;
- the snapshot paths, next to the source image, and the differences that remain;
- the assumptions still open, which the person must confirm in App Studio;
- the check results.

Publishing to a Pega server stays the person's step.
