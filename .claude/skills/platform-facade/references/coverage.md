# Facade coverage map

Runtime code in the gallery makes **no direct `PCore` calls** (stories and tests
excluded). Every call the components used to make has a facade member, listed
below by the platform API it wraps. This was checked against the tree on
2026-11-21, when the last 28 components were moved over.

To confirm nothing has crept back in:

```bash
grep -rn "PCore" src/components | grep -vE "shared/platform|\.test\.|stories|fixtures|\.mdx|\.json:|DESIGN.md" \
  | grep -vE ":\s*(//|\*|/\*)"
```

It should print nothing. If the API you need is not below, extend the facade (the
procedure is in `SKILL.md`) and add a row here.

## Platform API to facade member

| Platform call                                                                   | Facade member                                                           |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `getDataApiUtils().getData(view, options, context)`                             | `caseData.query`                                                        |
| `getDataApiUtils().getData(view, options)`, with no context                     | `caseData.queryUnscoped` (Calendar, GanttChart, CPQTree; see its JSDoc) |
| `getCaseEditLock` + `updateCaseEditFieldsData`                                  | `caseData.updateFields`                                                 |
| `getCaseEditLock` + `getContainerUtils().updateCaseContextEtag`                 | `caseData.refreshEtag`                                                  |
| `getDataObjectView`                                                             | `caseData.fetchDetailView`                                              |
| `getRestClient().invokeRestApi('loadView')`                                     | `caseData.loadView`                                                     |
| `invokeRestApi('save')` + `updateCaseContextEtag`                               | `caseData.saveAssignment`                                               |
| `invokeRestApi('createDataObject' / 'updateDataObject')`                        | `dataObjects.create` / `.update`                                        |
| `getDataPageUtils().getPageDataAsync`                                           | `dataPages.read` (`{ fresh: true }` sends `invalidateCache`)            |
| `getViewResources()` + transient container item + `createPConnect`, after fetch | `views.loadDetailView`                                                  |
| the same, with data already in hand                                             | `views.renderDetailView`                                                |
| `getViewResources().fetchViewResources` / `updateViewResources`                 | `views.metadata` / `views.addResources`                                 |
| `createPConnect({ meta, options: { pageReference, … } })` on a row or page      | `pages.at(...)` → `.actions`, `.listActions`, `.render`                 |
| `getPubSubUtils().subscribe/unsubscribe`                                        | `events.on` (returns `Unsubscribe`)                                     |
| `getPubSubUtils().publish`                                                      | `events.emit`                                                           |
| `getMessagingServiceManager().subscribe/unsubscribe`                            | `messaging.subscribe` (returns `Unsubscribe`)                           |
| `getSemanticUrlUtils()`, `ACTION_OPENWORKBYHANDLE` with page and handle         | `links.caseUrl`                                                         |
| the same with class and work id only                                            | `links.workUrl` (a different URL from `caseUrl`)                        |
| `getSemanticUrlUtils()`, `ACTION_SHOWVIEW`                                      | `links.pageUrl`                                                         |
| `getLocaleUtils().getLocaleValue`                                               | `text.locale`, or `text.loadingContent` for "Loading content..."        |
| `getContextTreeManager().addPageListNode` / `addViewNode`                       | `contextTree.registerPageList` / `.registerView`                        |
| `getPConnect().getValue(getConstants().CASE_INFO.<X>)`                          | `caseInfo.key()`, `className()`, `assignmentId()`, `actionId()`, …      |
| `getAttachmentUtils()` upload, link, list, download                             | `attachments.upload`, `.linkToCase`, `.forCase`, `.download`            |
| `getComponentsRegistry().getLazyComponent` + `getAssetLoader()`                 | `components.whenAvailable`                                              |
| `getStore().getState().data[context]` / `dispatch(SET_PROPERTY)`                | `store.contextData` / `store.setProperty`                               |
| `getContainerUtils().getContainerItems` / `getContainerItemData`                | `containers.items` / `containers.currentItem`                           |
| `getEnvironmentInfo()`                                                          | `environment.locale`, `.useLocale`, `.timeZone`, `.operatorId`          |
| `getCascadeManager().registerFields/unRegisterFields`                           | `fields.onChange` (returns `Unsubscribe`)                               |
| `getFormUtils().isFormValid`                                                    | `forms.isValid`                                                         |

`links` and `environment` need no PConnect, so they are also exported on their
own for helpers that run outside a component (CPQTree's link builder,
LangSwitch's page reload). Everything else goes through `createPlatform(getPConnect)`.

## Stories

25 `demo.stories.tsx` files still assign `window.PCore` themselves:
BarCode, CPQTree, Calendar, CardGallery, CaseLauncher, CaseReference, ChatGenAI,
CompareTableLayout, DateInput, GanttChart, ImageCarousel, JapaneseInput,
LangSwitch, MaskedInput, NetworkDiagram, OAuthConnect, OrgBuilder,
PasswordInput, QRCode, Scheduler, SecureRichText, Shortcuts, SignatureCapture,
StarRatingInput and Toggle. The fake now supplies every API their components
call, so each can move to `installPlatformFake` on its own.
