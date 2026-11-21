# Template components

A Template arranges content that App Studio authors drop into its **regions**.
It renders the platform's children and does not create fields itself.

| `subtype` | Hosted in                         | Content is                    |
| --------- | --------------------------------- | ----------------------------- |
| `DETAILS` | Details/summary views (read-only) | Fields render in display mode |
| `FORM`    | Form views on an assignment       | Fields are editable           |

Pick `FORM` only if the layout makes sense for editing.

**Start from the generator.** Write `tools/generator/specs/<name>.template.ts`:

```ts
import { defineTemplate, p, r } from '../define';

export default defineTemplate({
  name: 'TwoColumnSummary',
  label: 'Two column summary',
  description: 'Summary on the left, contacts on the right.',
  subtype: 'DETAILS',
  regions: [r.region('A', 'Summary'), r.region('B', 'Contacts', { accepts: ['Fields'] })],
  properties: [p.boolean('showDividers', 'Show dividers')],
});
```

`regions` defaults to one region `A` that accepts fields and views. The output
follows Pega's own template scaffolding (`@pega/custom-dx-components`,
`templates/Constellation/Template`):

- `heading` on every template, and `NumCols` (one, two or three columns) when
  there is one region.
- One region is laid out in a `NumCols` grid; several get a column each.
- DETAILS marks every region read-only (below).
- Tests that render every region, accept one region passed as a single element,
  and for DETAILS check each region was marked read-only.

## Regions

Each region is a `CONTENTPICKER` property in `config.json`:

```json
{
  "name": "A",
  "label": "Region A",
  "format": "CONTENTPICKER",
  "addTypeList": ["Fields", "Views"],
  "allowCreatingGroup": true
}
```

- `addTypeList` limits what an author can drop in: `"Fields"`, `"Views"`,
  `"Widgets"`, `"Insights"`.
- Regions are named `A`, `B`, … by convention.
- A region **is not a prop**. The platform renders each region and passes the
  results as `children`. The parity check knows this, so don't add `A` to the
  props type.

## Reading children

```tsx
type Props = { heading: string; children: any };

export const PegaExtensionsX = ({ heading, children }: Props) => (
  <FieldGroup name={heading}>
    <Grid container={{ cols: 'repeat(2, minmax(0, 1fr))', gap: 2 }}>{children}</Grid>
  </FieldGroup>
);
```

- `children` holds one rendered element per region, in `config.json` order.
  With one region it can arrive as a **single element, not an array**, as Pega's
  own scaffold notes. Some existing templates (FieldGroupAsRow among them) call
  `children.map` directly, which throws then. Always normalise with
  `Children.toArray(children)`.
- A DETAILS template shows its regions read-only by telling each region's
  PConnect so before it renders, as Pega's DETAILS scaffold does:
  `region.props.getPConnect().setInheritedProp('readOnly', true)` and
  `setInheritedProp('displayMode', 'DISPLAY_ONLY')`.
- If you need region metadata (names, the region's own config), use
  `getPConnect().getChildren()`. `Pega_Extensions_DynamicTemplate` reads it with a
  fallback to `props.children`.
- Don't reach into a child's internals. If a layout needs per-field information,
  read it through PConnect (`getChildren()` → `getPConnect().getRawMetadata()`)
  and render the child unchanged.

## Typical props

`heading` (FieldGroup title), layout knobs such as `NumCols` and
`gridTemplateColumns`, and `children`. Put sensible layout defaults in
`defaultConfig` so a freshly dropped template renders well.

## Story and test checklist

A story passes plain React elements as `children`, for example a few
`<div>Field A</div>` placeholders or real Cosmos inputs. No platform fake is
needed unless the template calls `getPConnect()`. Tests assert that every child
renders and that the layout knobs change the output, for example the column
count.
