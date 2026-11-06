# Facade coverage map

This table lists the `PCore` calls that gallery runtime code still makes directly
(stories and tests excluded) and what replaces each one. It was generated from
the tree on 2026-11-06. After `caseInfo` was added it stood at 40 runtime
files in 29 components, with 18 runtime files on the facade.

Regenerate the component column for any row:

```bash
grep -lF "getRestClient()" src/components/Pega_*/*.ts* | grep -v "stories\|test" | cut -d/ -f3 | sort -u
```

**When you extend the facade, move the row from the second table to the first.**

## Covered: replace with the facade member

| Direct call                                                                                                                                                      | Facade member                                                                                                              | Components still calling it directly                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getDataApiUtils().getData`                                                                                                                                      | `caseData.query`                                                                                                           | Banner, CPQTree, Calendar, DisplayAttachments, DisplayPDF, GanttChart, Meter, TaskList, UtilityList                                                        |
| `getDataApiUtils().getCaseEditLock` + `updateCaseEditFieldsData`                                                                                                 | `caseData.updateFields`                                                                                                    | (same set; check each)                                                                                                                                     |
| `getDataApiUtils().getDataObjectView`                                                                                                                            | `caseData.fetchDetailView`                                                                                                 | (same set; check each)                                                                                                                                     |
| `getViewResources()` + `createPConnect` + container transient item, to show a record's view                                                                      | `views.loadDetailView`                                                                                                     | CPQTree, DynamicHierarchicalForm, ExpandableTable, GanttChart                                                                                              |
| `getPubSubUtils().subscribe/unsubscribe` with `ASSIGNMENT_SUBMISSION`, `CREATE_STAGE_SAVED`, `EVENT_DASHBOARD_FILTER_CHANGE`, `EVENT_DASHBOARD_FILTER_CLEAR_ALL` | `events.on(…)`                                                                                                             | Calendar, GanttChart                                                                                                                                       |
| `getEvents().getCaseEvent()` / `getConstants().PUB_SUB_EVENTS` (only to name one of those events)                                                                | `events.on(…)`                                                                                                             | Calendar, GanttChart, FormWithVerticalStepper                                                                                                              |
| `getSemanticUrlUtils()` with `ACTION_OPENWORKBYHANDLE`                                                                                                           | `links.caseUrl`                                                                                                            | CPQTree, Calendar, NetworkDiagram, Scheduler, Shortcuts, UtilityList                                                                                       |
| `getLocaleUtils().getLocaleValue`                                                                                                                                | `text.locale` (or `text.loadingContent` for "Loading content...")                                                          | CPQTree, CompareTableLayout, DisplayPDF, DynamicHierarchicalForm, EditableTableLayout, ExpandableTable, FormWithVerticalStepper, GanttChart, Map, TaskList |
| `getContextTreeManager().addPageListNode`                                                                                                                        | `contextTree.registerPageList`                                                                                             | CPQTree, DynamicHierarchicalForm, EditableTableLayout, ExpandableTable, JawLayout, Map                                                                     |
| `getPConnect().getValue(getConstants().CASE_INFO.<X>)`                                                                                                           | `caseInfo.key()` `className()` `caseTypeId()` `assignmentId()` `actionId()` `availableActions()` `actionButtons()` `raw()` | None. All 11 callers migrated.                                                                                                                             |

Some calls in the first two rows feed sequences the facade doesn't wrap. For
example, a component may query and then post-process differently. Check what each
call site does before swapping it.

## Not covered yet: extend the facade first

These are ordered by how many components each would unblock.

| Direct call                                                                                 | Components                                                             | Notes for the new member                                                                                                      |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `createPConnect` for purposes other than a detail view (rendering child or region metadata) | Banner, CheckboxRow, EditableTableLayout, JawLayout, Map, RatingLayout | Check each first. Several share one "render this metadata in this context" pattern.                                           |
| `getRestClient().invokeRestApi`                                                             | AutoSave, Banner, CheckboxTrigger, ExpandableTable, TaskList           | Usually an etag-carrying case call. Look for a lock or etag sequence to own, as `updateFields` does.                          |
| `getStore().getState` / `dispatch`                                                          | CheckboxRow, CheckboxTrigger, DynamicHierarchicalForm, ExpandableTable | Reading or writing redux state directly. Find out what each one actually needs; it's often a value PConnect can already give. |
| `getDataPageUtils().getPageDataAsync`                                                       | ChatGenAI, NetworkDiagram, OAuthConnect, OrgBuilder                    | A single-page data page read. Natural home: `caseData` (or a new `dataPages`).                                                |
| `getMessagingServiceManager().subscribe/unsubscribe`                                        | Banner, DisplayAttachments, OAuthConnect                               | WebSocket messages. Should return `Unsubscribe`, like `events.on`.                                                            |
| `getPubSubUtils().publish`                                                                  | DisplayAttachments, FormWithVerticalStepper, UtilityList               | `events` has no `emit` yet. Add one for the named events only.                                                                |
| `getContainerUtils().updateCaseContextEtag`, `getContainerItems`, `getContainerItemData`    | AutoSave, Banner, CheckboxTrigger                                      | Often paired with `invokeRestApi`. Consider them together.                                                                    |
| `getAttachmentUtils().uploadAttachment` + `linkAttachmentsToCase`                           | CameraCapture, DisplayAttachments                                      | A two-step sequence, so it belongs in one member.                                                                             |
| `getComponentsRegistry().getLazyComponent`, `getAssetLoader()`                              | CompareTableLayout, EditableTableLayout, ExpandableTable               | Loading platform components and assets for table templates.                                                                   |
| `getContextTreeManager().addViewNode`                                                       | CPQTree                                                                | Add next to `registerPageList`, under the same `available` guard.                                                             |
| `getEnvironmentInfo().getOperatorIdentifier`                                                | OAuthConnect                                                           | The current operator's id.                                                                                                    |
| `getCascadeManager().registerFields/unRegisterFields`                                       | AutoSave                                                               | A pair; should return teardown.                                                                                               |
| `getFormUtils()`                                                                            | FormWithVerticalStepper                                                | A single caller. Hide it behind the facade only because it is `PCore`.                                                        |

## Stories

42 `demo.stories.tsx` files still assign `window.PCore` themselves, and only 1 uses
`installPlatformFake`. A story can be migrated as soon as the fake supplies every
API its component calls. That holds today for the components in the first table,
once their runtime code is migrated.
