# Template components

A Template arranges content that App Studio authors drop into its **regions**.
It renders the platform's children and does not create fields itself.

| `subtype` | Hosted in                         | Content is                    |
| --------- | --------------------------------- | ----------------------------- |
| `DETAILS` | Details/summary views (read-only) | Fields render in display mode |
| `FORM`    | Form views on an assignment       | Fields are editable           |

Pick `FORM` only if the layout makes sense for editing. Generator support for
Templates does not exist yet, so for now copy from
`Pega_Extensions_FormFullWidth` (FORM) or `Pega_Extensions_FieldGroupAsRow`
(DETAILS), the two smallest templates.

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

- `children` is normally an array. Some existing templates call `children.map`
  directly, which breaks on a single child. Use `React.Children.toArray(children)`
  in new code.
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
