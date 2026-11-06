---
name: platform-facade
description: How DX components in this repo talk to the Pega platform through the typed facade in src/components/shared/platform (createPlatform, installPlatformFake), how to extend it when an API is missing, and how to migrate a component or story off direct window.PCore access. Load whenever code calls or needs PCore, PConnect data/event/view/link APIs, pub/sub, data pages, case updates, or when writing a story or test that needs a platform double.
---

# Platform facade

`src/components/shared/platform/` is the only place in the gallery that may touch
the `PCore` global. Components get a typed object from it. Stories and tests get a
recording double that has the same shape.

```
types.ts            interfaces: Platform, CaseDataApi, EventsApi, …   (the contract)
index.ts            createPlatform(getPConnect): the only `pcore()` access
fake.ts             installPlatformFake(): a PCore double that records into `calls`
platform.test.ts    facade behaviour, tested against the fake
```

## Rule

Runtime code must not contain `(window as any).PCore` or `PCore.`. Every call goes
through `createPlatform(getPConnect)`.

`getPConnect()` itself is not `PCore`. Calls such as `getActionsApi()`, `getValue()`,
`getLocalizedValue()` and `getStateProps()` are made directly. The exception is a
value that needs a `PCore` constant to look up. For example,
`getValue(PCore.getConstants().CASE_INFO.CASE_INFO_ID)` is a `PCore` access; use
`platform.caseInfo.key()` instead.

To check a component:

```bash
grep -n "PCore" src/components/Pega_Extensions_<Name>/*.ts* | grep -v "stories\|test"
```

## Using it

```tsx
import { createPlatform } from '../shared/platform';

const platform = createPlatform(getPConnect);

platform.caseData.query('D_OpenTasks', { dataViewParameters: { assignee } });
platform.caseData.updateFields(caseKey, { pyStatusWork: 'Resolved-Completed' });
const view = await platform.views.loadDetailView({ dataPage, viewName, id, className });
useEffect(() => platform.events.on('assignmentSubmission', reload), []);
platform.links.caseUrl({ caseKey, className, workId });
platform.caseActions.preview(caseKey, className);
platform.contextTree.registerPageList({ pageReference, viewName: getPConnect().meta.name, pageListName: '.Items' });
platform.text.loadingContent();
const caseKey = platform.caseInfo.key(); // also className(), assignmentId(), actionId(), …

// a row of an embedded list: write to it, edit the list, or render on it
const row = platform.pages.at(`caseInfo.content.Items[${index}]`, { meta: props, target: getPConnect().getTarget() });
row.actions.updateFieldValue('.IsSelected', true);
platform.pages.at('caseInfo.content', { meta: props, referenceList: '.Items', index }).listActions.insert({}, index);
const cell = row.render(fieldMeta);

// named DX API operations
platform.caseData.loadView({ caseKey, className, viewId: 'pyCaseSummary' });
platform.caseData.saveAssignment({ assignmentId, actionId, etag, content: { Notes: 'draft' } });
platform.dataObjects.create('D_Tasks', { Label: 'Call back' });
```

The JSDoc in `types.ts` is the reference for each member. Read it rather than
guessing parameters.

- `createPlatform` is cheap and resolves the store context lazily, so call it
  where you need it, including inside a `useEffect`.
- `events.on` returns its own `Unsubscribe`. Return it straight from the
  `useEffect`. It is safe to call twice, and each subscription gets its own id.
- `updateFields` takes the edit lock and patches with that lock's etag. Do not
  call the lock or patch APIs separately.
- `contextTree.registerPageList` does nothing on platforms that lack the context
  tree manager. Check `contextTree.available` only if behaviour must differ.
- `caseInfo` reads the store each time you call it, and nothing is cached, so read
  inside the handler that needs the value. Values come back unchanged (`''` stays
  `''`), and on a page with no case nothing throws. `actionId()` returns the
  active action, falling back to the assignment's own action.
- To read through a PConnect other than the component's own (a `pConn` captured
  in a hook, a child's PConnect), pass that object: `createPlatform(() => pConn)`.
- `pages.at` is how a component writes to, edits, or renders on a page other
  than its own, such as a row of an embedded list. Only `context` has a
  default (the component's). Every other option is sent only when you pass it,
  so pass exactly what the platform needs: `target` for actions, and
  `referenceList` (plus `index` for an insert) for list actions.
- `saveAssignment` sends the save and then stores the returned etag. Never call
  the REST save on its own, or the next write fails as stale.

## When the API you need is missing

[references/coverage.md](references/coverage.md) maps each `PCore` call the
gallery still makes directly to its facade member, or marks it as not covered yet.
If it's not covered, extend the facade. Change all four files in one change:

1. **`types.ts`**: add the member to an existing interface, or a new interface
   on `Platform`. Write JSDoc that says what it does and anything the caller
   would otherwise get wrong.
2. **`index.ts`**: implement it with `pcore()` and `getPConnect`. This is the
   only file where the platform's raw names appear.
3. **`fake.ts`**: implement the raw `PCore` side it calls. If it has a side
   effect, record it in a new `calls` entry, and add that entry to both the
   `PlatformFake['calls']` type and the initial `calls` object.
4. **`platform.test.ts`**: test it against the fake, including the failure or
   version-guard path, not only the happy path.

Then move the call sites over, and update `references/coverage.md`.

### Design rules for new members

These come from the members that already exist. Follow them so the facade stays
one coherent API:

- **Name the operation, not the platform API.** For example,
  `text.loadingContent()` replaces a three-argument locale lookup that 13
  components spelled out by hand, and `events.on('assignmentSubmission')` replaces
  raw event constants.
- **Own multi-step sequences.** Examples are lock then patch, and fetch, register,
  transient container, then render. A sequence that callers have to get in the
  right order belongs inside the facade.
- **Keep version guards inside.** Resolve "does this platform have X" once in
  `index.ts`. If the caller needs to know, expose it as a boolean like `available`.
- **Hand back teardown.** Anything that subscribes returns an `Unsubscribe`, so
  callers never have to pair ids themselves.
- **Keep types precise outside and loose inside.** `GetPConnect` stays `any`. The
  interfaces in `types.ts` are what callers depend on, so type them exactly.
- **Don't add a member for a single caller unless it hides `PCore`.** A thin
  wrapper over a `getPConnect()` call adds nothing.
- **Preserve behaviour over elegance.** If a native PConnect accessor looks
  equivalent to the raw read but you can't confirm it without a server, keep the
  exact read and note the possible switch in `index.ts`. `caseInfo` does this:
  `getCaseInfo().getKey()` probably matches `getValue(CASE_INFO_ID)`, but that is
  unproven.
- **Make the fake able to catch a wrong read.** Give each value a distinct key and
  a distinct test value. A fake that returns the same thing for every path lets a
  member read the wrong field and still pass.

## Stories and tests

Use the shared fake instead of assigning `window.PCore` in a story:

```tsx
import { installPlatformFake } from '../shared/platform/fake';

export const Default: Story = {
  render: (args) => {
    const platform = installPlatformFake({ rows: sampleRows });
    return <PegaExtensions<Name> {...args} getPConnect={platform.getPConnect} />;
  },
};
```

| Option                        | Use                                                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `rows`                        | What `caseData.query` resolves with                                                                        |
| `detailData`                  | `dataInfo` for detail-view fetches                                                                         |
| `renderView`                  | What a loaded detail view renders; defaults to a `data-testid="detail-view"` marker                        |
| `pConnect`                    | Override or add `getPConnect()` methods, e.g. `getValue`                                                   |
| `actions`                     | Override or add actions-API methods, e.g. make `openLocalAction` visible in a story                        |
| `contextTreeAvailable: false` | Simulate an older platform                                                                                 |
| `caseInfo`                    | The case `platform.caseInfo` reads (`key`, `className`, `activeActionId`, …); omit for a page with no case |
| `restResponses`               | What each REST endpoint resolves with, e.g. `{ save: { headers: { etag: 'e-2' } } }`                       |

- For a component that never touches `PCore`, use
  `createFakeGetPConnect(overrides)`. It doesn't install a global and doesn't
  record.
- In tests, assert on `platform.calls`: `queries`, `fieldUpdates`, `fieldValues`,
  `detailViews`, `subscriptions`, `openedCases`, `localActions`, `createdCases`,
  `previewedCases`, `registeredPageLists`, `pages` (each scope and the exact
  options sent), `pageCalls` (every action run on a scoped page), `restCalls`
  and `etagUpdates`. After `unmount()`, assert `platform.allUnsubscribed()`.
- Call `restore()` in `afterEach`. It puts the previous global back.
- If a component needs a `PCore` API the fake lacks, add it to `fake.ts`, not to
  the story.

## Migrating an existing component

Work one component per change:

1. List its `PCore` calls with the grep above, and look each one up in
   `references/coverage.md`.
2. Extend the facade for anything not covered (the procedure above), in its own
   change ahead of the migration.
3. Replace the call sites. Keep behaviour identical. A migration is not a redesign.
4. Replace the story's `setPCore` or `window.PCore = …` stub with
   `installPlatformFake`. Many stubs mock APIs the component never calls; for
   example, the `Toggle` story stubs `getComponentsRegistry` and
   `getEnvironmentInfo`, and `Toggle` uses neither. Delete those rather than port them.
5. Add or strengthen a test that asserts on `platform.calls` for the main side
   effect. Before the migration, a hand-written stub couldn't check it.
6. Run the checks from `CLAUDE.md`, and the facade's own tests:
   `npx jest src/components/shared/platform`.

`Pega_Extensions_KanbanBoard` is the finished example: index.tsx, utils.ts,
Task.tsx and its story are all on the facade.
