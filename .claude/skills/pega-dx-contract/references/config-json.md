# config.json

App Studio renders `properties` as the component's property panel. The other
top-level keys classify the component and are mostly fixed.

## Top-level keys

| Key                                                    | Value                                                                                       |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `name`, `componentKey`                                 | `Pega_Extensions_<Name>`, the same as the folder                                            |
| `label`                                                | Display name in App Studio, e.g. `"Kanban Board"`                                           |
| `description`                                          | One line                                                                                    |
| `organization` / `library` / `version`                 | `"Pega"` / `"Extensions"` / the library version (`tasks.config.json` → `component.version`) |
| `allowedApplications`                                  | `[]`                                                                                        |
| `type` / `subtype`                                     | See the type table in SKILL.md                                                              |
| `icon`                                                 | Optional, e.g. `"images/pz-checkbox-active.svg"`                                            |
| `properties`                                           | Panel definition (below)                                                                    |
| `defaultConfig`                                        | Initial values when an author drops the component into a view                               |
| `buildDate`, `infinityVersion`, `packageCosmosVersion` | **Written by the build. Do not edit.**                                                      |

## Property entries

```json
{ "name": "heading", "label": "Heading", "format": "TEXT" }
```

`name` is the prop the component receives. Optional keys: `required`,
`defaultValue`, `visibility`, `source` (for SELECT), `localize`.

### Formats that become props

These need a matching field in the props type, and the component must read it:

| Format                                  | Prop type                          | Notes                                                       |
| --------------------------------------- | ---------------------------------- | ----------------------------------------------------------- |
| `TEXT`, `VALUEINPUT`, `FIELDLABELINPUT` | `string`                           |                                                             |
| `NUMBER`                                | `number`                           |                                                             |
| `BOOLEAN`                               | `boolean`                          | May arrive as the string `'true'` at runtime (see field.md) |
| `SELECT`                                | union of the `source[].key` values | `source: [{ "key": "auto", "value": "Auto" }]`              |
| `PROPERTY`                              | property reference                 | e.g. a context property for filtering a data page           |
| `READONLY`, `REQUIRED`, `DISABLED`      | `boolean`                          | Standard Field condition props                              |

### Formats the platform consumes (never props)

From `tools/config-parity/parity.ts`, the source of truth:

- `GROUP`: a panel section. Its nested `properties` follow the same rules.
  `collapsible: true` is allowed.
- `LABEL`: static panel text.
- `VISIBILITY`: evaluated by the platform around the component.
- `CONTENTPICKER`: a Template region, delivered as `children`.
- `CASELINK`: resolved into a case link by the platform.
- `labelOption` (by name, not format): resolved into `label` through
  `defaultConfig.label`.

### Visibility expressions

`visibility` decides whether a panel entry is shown. Patterns already in use:

- `"$this.columnWidth == 'custom'"` and `"$this.label IS_NULL"`: refer to another
  property on this component.
- `"(!readOnly = true)"`: hide the entry when the field is read-only.
- `"@ISINEMBEDDEDDATAMULTI == true"`: the field is inside a table or embedded list.
- `"@VIEWTEMPLATESUBTYPE == 'FORM'"` and `"@RULEVIEWTYPE == 'search'"`: the kind
  of view hosting the component.

If you need a form not listed here, copy it from an existing `config.json` and
cite which one. Don't invent operators.

### Standard blocks

Every component ends with the About block:

```json
{ "format": "LABEL", "label": "About", "name": "PegaAboutLabel", "variant": "h3" },
{ "format": "LABEL", "label": "Pega_Extensions <version>, <date>", "name": "PegaAboutData", "variant": "primary" }
```

Fields also carry the `Conditions` group (`required`, `disabled`, `visibility`)
and an `Advanced` group with `testId`. `tools/generator/emit-config.ts` emits all
of these. Read it rather than retyping them.

### `defaultConfig` value prefixes

- `"@L Yes"`: a localizable literal.
- `"@L $this.label"`: the localized value of another property.
- `"@FL .$this.name"`: the bound field's own label (used for Field captions).
