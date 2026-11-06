# Widget components

A Widget stands alone. It isn't bound to a property and has no regions. It fetches
what it needs (data pages, case data, views) and acts through the platform.

| `subtype`          | Placed on                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `["PAGE", "CASE"]` | A landing page/dashboard **or** a case. 15 of the 17 widgets use this.                   |
| `"CASE"`           | A case only, when it needs the case context (e.g. `DisplayAttachments`, `CameraCapture`) |

Choose `"CASE"` only when the widget is meaningless without a case. On a page
there is no case, so any case lookup must handle that absence.

Generator support for Widgets does not exist yet. The reference implementation is
`Pega_Extensions_KanbanBoard`, which is fully on the platform facade (index.tsx,
utils.ts, Task.tsx and its story).

## Props

Everything comes from the property panel. There are no Field runtime props. Common
ones:

- `heading`: the card title.
- `dataPage`: the name of a list data page to query, plus an optional
  `PROPERTY`-format context property for filtering it.
- Detail-view pair: `detailsDataPage` + `detailsViewName`, used to open a case's view.
- `getPConnect`.

Mark properties the widget cannot work without as `required: true` in
`config.json`, and give the rest defaults in `defaultConfig`.

## Talking to the platform

All of it goes through `createPlatform(getPConnect)`:

| Need                                       | Facade member                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| The case it is on (key, class, assignment) | `platform.caseInfo.key()`, `className()`, `assignmentId()`; on a page, no case |
| Query a data page                          | `platform.caseData.query(dataView, options)`                                   |
| Update case fields (edit lock handled)     | `platform.caseData.updateFields(caseKey, fields)`                              |
| Render a case's view inline                | `platform.views.loadDetailView({ dataPage, viewName, id, className })`         |
| React to submit, save or dashboard filters | `platform.events.on('assignmentSubmission', handler)` → returns `Unsubscribe`  |
| Loading text and other platform strings    | `platform.text.loadingContent()`                                               |
| Case URLs, case actions, context tree      | `platform.links`, `platform.caseActions`, `platform.contextTree`               |

Open a local action (edit modal) with `getPConnect().getActionsApi().openLocalAction(...)`.
That's a PConnect call, so making it directly is fine.

## The lifecycle to get right

```tsx
const [loading, setLoading] = useState(true);

useEffect(() => {
  const platform = createPlatform(getPConnect);
  load(); // initial fetch
  return platform.events.on('assignmentSubmission', load); // refresh + cleanup
}, [dataPage]);
```

- Show Cosmos `Progress` while loading, an empty state when there are no rows,
  and an error state when the query rejects. All three need a story.
- Re-fetch when the inputs that drive the query change, not on every render.
- Always return the unsubscribe function. The fake records subscriptions, so a
  test can `unmount()` and then `expect(platform.allUnsubscribed()).toBe(true)`.

## Story and test checklist

```ts
const platform = installPlatformFake({
  rows: [
    /* data page rows */
  ],
  detailData: {
    /* … */
  },
});
// args: { ..., getPConnect: platform.getPConnect }
```

Stories to include: populated, empty, and loading if it's reachable. Tests should
render rows from the fake, perform the main interaction and assert it on
`platform.calls` (`queries`, `fieldUpdates`, `detailViews`, `localActions`, …),
and check that unmounting unsubscribes.
