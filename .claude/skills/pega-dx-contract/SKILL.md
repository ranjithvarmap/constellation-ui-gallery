---
name: pega-dx-contract
description: The contract a Pega Constellation DX component must meet in this repo — folder and file set, config.json schema, runtime props from PConnect, and the per-type rules for Field, Template and Widget components. Load before creating, changing, reviewing or debugging anything under src/components/Pega_Extensions_*, or when writing config.json, a property panel, demo.stories.tsx, demo.test.tsx or Docs.mdx for one.
---

# Pega DX component contract

A DX component is a React component that Pega Constellation loads at runtime
and App Studio configures through a property panel. The two halves are:

- **`config.json`** — what App Studio shows an author (the property panel) and
  how the platform classifies the component.
- **`index.tsx`** — what the component does with the props that result.

Most defects in this repo live in the gap between them. Keep them in step.

## Step 1: identify the type

Read `type` and `subtype` in the component's `config.json`. Then read the matching
reference before writing code:

| `type`     | `subtype`                                                                                                                                         | What it is                                            | Reference                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| `Field`    | `Text`, `Text-Paragraph`, `Text-URL`, `Text-Email`, `Integer`, `Decimal`, `Decimal-Currency`, `Decimal-Percentage`, `Boolean`, `Date`, `Picklist` | Renders and edits **one property**                    | [references/field.md](references/field.md)       |
| `Template` | `DETAILS` or `FORM`                                                                                                                               | Lays out **regions** that hold other fields and views | [references/template.md](references/template.md) |
| `Widget`   | `["PAGE", "CASE"]` or `"CASE"`                                                                                                                    | Standalone: on a landing page and/or a case           | [references/widget.md](references/widget.md)     |

For new work, choose the type from what the component binds to. Use a Field if it
binds to one property, a Template if it arranges other content, and a Widget if it
binds to neither.

[references/config-json.md](references/config-json.md) covers the property-panel
schema shared by all three types.

## Step 2: the file set

```
src/components/Pega_Extensions_<Name>/
  index.tsx            component; named export + default withConfiguration(...)
  config.json          property panel + classification
  demo.stories.tsx     Storybook stories; also the test fixtures
  demo.test.tsx        RTL tests rendered via composeStories
  Docs.mdx             Storybook docs page
  styles.ts            styled-components (optional)
  localizations.json   source strings for getLocalizedValue (if any UI text)
  *.tsx / utils.ts     sub-components and helpers (optional)
```

Naming is fixed: the folder name, `config.json` `name` and `componentKey` are all
`Pega_Extensions_<Name>`. The named export is `PegaExtensions<Name>`.

## Step 3: rules for every type

1. **Skeleton of `index.tsx`:**

   ```tsx
   import { withConfiguration } from '@pega/cosmos-react-core';
   import '../shared/create-nonce';

   export type <Name>Props = { getPConnect: any; /* … */ };
   export const PegaExtensions<Name> = (props: <Name>Props) => { /* … */ };
   export default withConfiguration(PegaExtensions<Name>);
   ```
   - The `create-nonce` import copies the page's CSP nonce to webpack's runtime.
     Without it, the styles that styled-components injects are blocked on hosts
     with a strict CSP.
   - `withConfiguration` wraps the component in Cosmos configuration and theme.
     Stories and tests import the **named** export, which is unwrapped.

2. **The props type and `config.json` describe the same set of properties.**
   Add or rename them together. `npx jest tools` fails when a panel property is
   never read. Only remove entries from `tools/config-parity/known-drift.json`;
   never add them.
3. **No `PCore` global.** Use `createPlatform(getPConnect)` from
   `../shared/platform`. It exposes `context`, `caseData`, `text`, `views`,
   `events`, `links`, `caseActions` and `contextTree`. If something is missing,
   extend `types.ts`, `index.ts` and `fake.ts` in the same change. `getPConnect()`
   calls such as `getActionsApi()`, `getValue()` and `getLocalizedValue()` are fine
   to make directly.
4. **Localize UI text.** Call `getPConnect().getLocalizedValue('Create new task')`
   and add the same key and value to `localizations.json` under `"fields"`.
5. **Use Cosmos first.** Use `@pega/cosmos-react-core`, `-work`, `-social` and
   `-rte` components, `useTheme()`, and theme tokens in `styles.ts`. Check a
   component's props in `node_modules/@pega/cosmos-react-*/lib/**/*.d.ts` rather
   than guessing them. Register an icon before you use it:
   `registerIcon(plusIcon)`.
6. **Clean up subscriptions.** Return the `Unsubscribe` from
   `platform.events.on(...)` from the `useEffect`.

## Step 4: stories, tests, docs

- **Story** `title` is `Fields/<Name>`, `Templates/<Name>` or `Widgets/<Name>`.
  Set `component` to the named export. Hide `getPConnect` (and other runtime-only
  props) from controls with `table: { disable: true }`. Set
  `parameters.a11y.context` to `'#storybook-root'`.
- **Platform double:** call `installPlatformFake({...})` from
  `../shared/platform/fake` and pass `platform.getPConnect`. Do not assign
  `window.PCore` in a story. You will see that pattern in older files; it is the
  thing being migrated away from.
- **Test:** `composeStories(DemoStories)`, render a story, and query by role or
  visible text. Assert on `platform.calls` for side effects such as field updates,
  subscriptions and view loads. Give each story its own fake and `restore()` it.
- **Docs.mdx:** `<Meta of={DemoStories} />`, a short overview paragraph,
  `<Primary />`, `<Controls />`, then a `<Story of={...} />` per notable state.

## Step 5: verify

```bash
npm run lint:types
npx eslint src/components/Pega_Extensions_<Name>
npx jest src/components/Pega_Extensions_<Name>
npx jest tools
```

`npm run buildComponent` is Pega's validation. It may prompt, so hand it to the
user instead of running it unattended.

## Choosing an example to copy

Copy only from components that already follow rules 3 and 4. At the time of
writing, those are the components that import `../shared/platform`:

```bash
grep -l "shared/platform" src/components/Pega_*/*.tsx
```

Prefer `tools/generator` output for Fields over any hand-written Field.
