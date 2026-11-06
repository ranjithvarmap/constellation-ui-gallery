# Field components

A Field is bound to one property of the case or data object. Constellation hands
it the value and the field's state. The component must write changes back through
the actions API, because setting local state alone persists nothing.

**Start from the generator:** write a spec in `tools/generator/specs/<name>.field.ts`
with `defineField` and `p.*` from `tools/generator/define.ts`, then run
`npm run generate -- <spec>`. It emits all six files with `config.json` and the
props type built from the same list. Hand-edit only the component logic afterwards.
Read the generated `index.tsx` as the reference implementation for the rules below.

## Runtime props

Constellation passes these alongside the authored properties:

| Prop                                  | Meaning                                            |
| ------------------------------------- | -------------------------------------------------- |
| `getPConnect`                         | Accessor for this field's PConnect                 |
| `value`                               | Current property value                             |
| `label`, `hideLabel`                  | Resolved label and whether to hide it              |
| `helperText`, `placeholder`, `testId` | From the panel                                     |
| `readOnly`, `required`, `disabled`    | Conditions (see coercion below)                    |
| `displayMode`                         | `'DISPLAY_ONLY'`, `'LABELS_LEFT'` or `''`          |
| `validatemessage`                     | Server or client validation error; `''` when valid |
| `hasSuggestions`                      | True while a suggestion is pending for this field  |
| `fieldMetadata`, `additionalProps`    | Platform metadata; usually pass-through            |

### Coerce the condition props

`readOnly`, `required` and `disabled` arrive as the **string** `'true'` or
`'false'` when a condition drives them. Both strings are truthy, so passing one
straight through renders a field whose condition is false as locked. Type them
`boolean | string` and coerce them once, before anything reads them. This is
the generator's form:

```ts
const isTrue = (flag?: boolean | string): boolean => flag === true || flag === 'true';

const { readOnly: readOnlyFlag, required: requiredFlag, disabled: disabledFlag } = props;
const readOnly = isTrue(readOnlyFlag);
const required = isTrue(requiredFlag);
const disabled = isTrue(disabledFlag);
```

Renaming on the way in means nothing downstream can reach the raw string. Eleven
older hand-written Fields do the same with a `.map` over a reassigned `let`.

## Writing the value back

```ts
const pConn = getPConnect();
const actions = pConn.getActionsApi();
const propName: string = pConn.getStateProps().value; // e.g. ".PolicyRef"

const handleChange = (e) => actions.updateFieldValue(propName, e.target.value); // every edit
const handleBlur = () => actions.triggerFieldChange(propName, value); // commit: runs validation/when rules
```

For a Boolean, write `e.target.checked` instead. Local React state, such as an
input draft, is fine, but it must still reach `updateFieldValue`, or the edit is
lost on submit.

## The render branches

Every Field has to handle all of these:

1. `displayMode === 'DISPLAY_ONLY'`: render the formatted value only, with no
   label or control. Cosmos `Text` is typical.
2. `displayMode === 'LABELS_LEFT'`: Cosmos `FieldValueList`,
   `variant={hideLabel ? 'stacked' : 'inline'}`.
3. Editable or read-only: wrap the control in Cosmos `FormField` (or a Cosmos
   input that includes it). Pass `label`, `labelHidden={hideLabel}`,
   `info={validatemessage || helperText}`,
   `status={validatemessage ? 'error' : undefined}`, `required`, `disabled`,
   `readOnly` and `testId`. The generator hands `readOnly` to the control and
   lets Cosmos render it read-only. Some hand-written Fields, such as `Toggle`,
   instead return plain text when `readOnly` is set. Either is valid; pick one
   and test it.

When `hasSuggestions` is true, set the status to `'pending'`.

For display branches, show what a person reads, not the stored key. Examples: a
Picklist shows the option label, and a Boolean shows the `trueLabel`/`falseLabel`
pair (`displayValue` `Yes/No` or `True/False`).

## Picklist options

Options are never hardcoded. A local list arrives on `datasource`, and a data page
arrives on `getPConnect().getConfigProps().listOutput`, keyed by `listType`. The
item shape is `{ key, text, value }`. The stored value is `key`. The label is
`text` for a data page or `value` for a local list. The generator implements this.

## Story and test checklist

Cover at least these stories: `Default` (editable), `ReadOnly`, `DisplayOnly`,
and an error state with `validatemessage`. Test the condition props with both
strings, `'true'` and `'false'`, not just the booleans; the generator emits that
test. Tests should check that the label and
helper text render, that the read-only branch has no input
(`queryByRole(...)` → not in document), and that an edit reaches the store. The
fake records every `updateFieldValue` call in `platform.calls.fieldValues`
(`[{ property: '.value', value: … }]`). Its `getStateProps().value` is `'.value'`.
