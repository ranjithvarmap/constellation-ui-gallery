---
name: new-dx-component
description: Create a new Pega Constellation DX component in this repo — Field, Template or Widget — from a spec, through tools/generator, and take it through every check including Pega's own build. Use whenever someone asks for a new component, a new field type, a new layout/template, or a new widget, or invokes /new-dx-component.
---

# New DX component

Every new component starts as a spec. The generator emits `config.json` and the
props type from that one spec, so the property panel and the component cannot
drift, and it emits stories, tests and docs that already pass the repo's checks.
Do not hand-write a component, and do not copy an existing one as a starting
point; most predate the conventions.

Load `pega-dx-contract` for the rules behind each type, and `platform-facade`
before writing anything that talks to the platform.

## 1. Choose the type

| The component…                                | Type         | Spec             |
| --------------------------------------------- | ------------ | ---------------- |
| binds one property of the case or data object | **Field**    | `defineField`    |
| arranges content authors drop into regions    | **Template** | `defineTemplate` |
| stands alone on a case, a page, or both       | **Widget**   | `defineWidget`   |

If it is unclear, ask what the author configures in App Studio: one property
(Field), regions (Template), or neither (Widget).

## 2. Write the spec

File: `tools/generator/specs/<kebab-name>.<field|template|widget>.ts`, with a
default export. Authored properties use the same builders for every type:
`p.text`, `p.number`, `p.boolean`, `p.select` (its keys become a TS union),
`p.dataPage`.

```ts
// Field: subtype is one of Text, Picklist, Text-Paragraph, Text-Email,
// Text-URL, Integer, Decimal, Boolean, Date.
import { defineField, p } from '../define';
export default defineField({
  name: 'PolicyReference',
  label: 'Policy reference',
  description: 'Captures a policy reference with a configurable prefix.',
  subtype: 'Text',
  properties: [p.text('prefix', 'Reference prefix', { defaultValue: 'POL-' })],
});
```

```ts
// Template: regions default to one region A.
import { defineTemplate, r } from '../define';
export default defineTemplate({
  name: 'TwoColumnSummary',
  label: 'Two column summary',
  description: 'Summary on the left, contacts on the right.',
  subtype: 'DETAILS', // or 'FORM'
  regions: [r.region('A', 'Summary'), r.region('B', 'Contacts')],
});
```

```ts
// Widget: a list is optional; without one it is a bare card.
import { defineWidget } from '../define';
export default defineWidget({
  name: 'RelatedTasks',
  label: 'Related tasks',
  description: 'Tasks raised against this case.',
  subtype: 'CASE', // or 'PAGE', or ['PAGE', 'CASE']
  list: { columns: [{ field: 'pyLabel', label: 'Task' }], caseParameter: 'CaseInstanceKey' },
});
```

The spec is validated when it loads. A name that is not PascalCase, a property
that is not camelCase or shadows a standard prop, a duplicate region, or a case
parameter on a page-only widget all fail with a message saying what to change.

## 3. Generate

```bash
npm run generate -- tools/generator/specs/<file>.ts --plan   # what it will make; writes nothing
npm run generate -- tools/generator/specs/<file>.ts
```

`--plan` describes the component, its App Studio settings, the files and every
`TODO` left for you; show it to the person before generating when the spec
involved guesses. Generating refuses to overwrite an existing component;
`--force` overwrites.

## 4. Implement

The generated component works as-is. What is left for you is marked `TODO`:

- **Authored properties** are typed on the props but not read yet. Destructure
  each one as you implement it. config-parity accepts a typed prop, but a knob
  that does nothing is still a defect.
- **A bare widget's content.**

When you add behaviour, extend the generated story and test rather than
replacing them. Stories use `installPlatformFake`; tests assert on
`platform.calls`.

## 5. Check

All of these, scoped to the new folder where they allow it:

```bash
C=src/components/Pega_Extensions_<Name>
npm run lint:types                       # tsc, root config
npx tsc -p tsconfig.build.json --noEmit  # the config Pega's bundler uses
npx eslint $C
npx jest $C
npx jest tools                           # config parity + generator
npx custom-dx-components buildComponent Pega_Extensions_<Name> N N </dev/null
git checkout -- store && git clean -fdq store
```

The last two lines run Pega's own build (config schema, lint, bundle) without
prompting or contacting a server, then put back the archive it rewrites under
`store/`. Report each result. Publishing to a server is the user's step.

## 6. Look at it

`npm start` serves Storybook on port 6006. The component is under `Fields/`,
`Templates/` or `Widgets/` by its label. A widget with a list has `Default`,
`Empty` and `LoadFailed` stories.

`npm run snapshot -- <Name>` photographs every story to
`.snapshots/Pega_Extensions_<Name>/` (starting Storybook if needed) and prints
errors a story throws. Read the pictures to check the result looks right.

Starting from a screenshot or mockup instead of a description? Use the
`component-from-image` skill; it writes the spec from the image and ends here.
