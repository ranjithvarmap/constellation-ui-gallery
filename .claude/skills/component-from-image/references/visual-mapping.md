# From what you see to a spec

Three tables: what Pega already renders (build nothing), how to recognise the
type, and how each visual detail maps onto the spec builders in
`tools/generator/define.ts`. When a detail has no row here, it is
hand-written in step 6 and listed under "Not covered by the generator".

## Standard: Pega renders it, build nothing

Check App Studio before building any of these. Build a custom one only when
the image needs something the stock one cannot do, and say what that is.

| On the screen                                                            | Stock Constellation piece                     |
| ------------------------------------------------------------------------ | --------------------------------------------- |
| Text box, text area, email, URL, phone                                   | Text, Paragraph, Email, URL, Phone fields     |
| Number, money, percentage                                                | Integer, Decimal, Currency, Percentage fields |
| Date, date and time, time picker                                         | Date, Date time, Time fields                  |
| Single checkbox, yes/no                                                  | Boolean field (checkbox or toggle display)    |
| Dropdown, radio buttons from a list                                      | Picklist field (dropdown or radio display)    |
| Search-as-you-type lookup                                                | Autocomplete / data reference field           |
| Fields in one, two or three columns; wide-narrow                         | Stock form and details layouts                |
| Labelled sections, tabs of fields                                        | Stock field groups and tabbed layouts         |
| A table of embedded rows                                                 | Stock table (embedded data / list view)       |
| Attachments, followers, stakeholders, case history, related cases, tasks | Stock case widgets                            |

## Which type

| What the picture shows                                                                                                       | Type              | Why                                           |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------- |
| One labelled value with a custom control: stars, a slider, a colour band, a code, a signature, a badge, a sparkline          | **Field**         | It binds one property                         |
| A custom arrangement of other fields: a card grid, a stepper of sections, a side-by-side compare, a timeline of field groups | **Template**      | Authors drop fields and views into it         |
| A panel with its own heading and data: a list of related items, a chart, a map, a calendar, a set of actions                 | **Widget**        | It stands alone and loads its own data        |
| A whole page made of several of these                                                                                        | **Several specs** | One per custom item; standard items need none |

A widget that only shows this case's own fields is usually a Template or a
stock view. A widget fetches or acts on something beyond the case's fields.

## Field: visual details

| Seen                                                                               | Spec                                                                           |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| A free text value                                                                  | `subtype: 'Text'`                                                              |
| Multi-line text                                                                    | `'Text-Paragraph'`                                                             |
| An email or a link                                                                 | `'Text-Email'`, `'Text-URL'`                                                   |
| A whole number, a decimal                                                          | `'Integer'`, `'Decimal'`                                                       |
| A date                                                                             | `'Date'`                                                                       |
| On/off, yes/no, a single tick                                                      | `'Boolean'`                                                                    |
| One choice from a list of options                                                  | `'Picklist'`; the options belong to the Pega property, not the spec            |
| A hint under the control                                                           | keep `inputSettings` with `'helperText'` (default)                             |
| Placeholder text in an empty control                                               | keep `'placeholder'` (default)                                                 |
| A unit, prefix or suffix shown with the value ("kg", "POL-") the author may change | `p.text('unit', 'Unit', { defaultValue: 'kg' })`                               |
| A count or limit drawn into the control (5 stars, 10 steps)                        | `p.number('maxRating', 'Maximum rating', { defaultValue: 5 })`                 |
| A visual variant shown in some images and not others (compact, with icon)          | `p.boolean(...)`, or `p.select(...)` for more than two                         |
| A fixed visual style that never varies                                             | Nothing in the spec; hand-write it in `styles.ts`                              |
| A red asterisk, an error line, a greyed-out control                                | Standard props `required`, `validatemessage`, `disabled`; add a story for each |
| The value shown as plain text                                                      | The read-only display branch; add a read-only story                            |
| The field opens other cases, publishes events or reads case data                   | `capabilities: ['links']`, `['events']`, `['caseData']`                        |

The stock control is a Cosmos input of that subtype. A custom look (stars
instead of a number box) keeps the matching subtype, so the property type is
right, and replaces the control in step 6.

## Template: visual details

| Seen                                                             | Spec                                                                                                      |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Editable inputs inside the layout                                | `subtype: 'FORM'`                                                                                         |
| Values shown as read-only text                                   | `subtype: 'DETAILS'`                                                                                      |
| Each separate area that holds fields (a column, a card, a panel) | One `r.region('A', '<its heading>')`, named A, B, C in reading order                                      |
| An area holding widgets rather than fields                       | `r.region(..., { accepts: ['Widgets'] })`                                                                 |
| An area with several labelled groups the author creates          | `{ allowCreatingGroup: true }`                                                                            |
| A heading over the whole layout                                  | Standard `heading` setting; its default is the spec `label`                                               |
| Fields in 1 to 3 columns inside a single region                  | Standard "Number of columns" setting (`NumCols`), emitted for any one-region template; no property needed |
| An orientation or style the author can switch                    | `p.select(...)`, `p.boolean(...)`                                                                         |
| The geometry itself (card shapes, a stepper rail)                | Hand-written in step 6                                                                                    |

## Widget: visual details

| Seen                                                       | Spec                                                                                                                          |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Sits beside a case, about that case                        | `subtype: 'CASE'`                                                                                                             |
| Sits on a landing page or dashboard                        | `subtype: 'PAGE'`                                                                                                             |
| Both                                                       | `subtype: ['PAGE', 'CASE']`                                                                                                   |
| A table or list of rows                                    | `list: { columns: [...] }`, one column per header, left to right                                                              |
| Column headers                                             | Column `label`s, exactly as written                                                                                           |
| The Pega field behind each column                          | Column `field`; ask, or use a placeholder listed under _Assumed_. The data page itself is a standard setting the author picks |
| Rows are "for this case"                                   | `list.caseParameter`; ask for the data page parameter name                                                                    |
| An empty-state message, a loading spinner, an error banner | Generated; give each a story with the image's wording                                                                         |
| A card with no list (chart, map, form, buttons)            | No `list`; the content is hand-written                                                                                        |
| Row actions, a header button, a count badge                | Hand-written in step 6, through the facade                                                                                    |
| A title over the panel                                     | Standard `heading` setting; its default is the spec `label`                                                                   |
