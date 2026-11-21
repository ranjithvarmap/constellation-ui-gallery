/**
 * Typed boundary over the Constellation platform globals (`PCore` and `PConnect`).
 *
 * Components should depend on these interfaces rather than reaching for
 * `(window as any).PCore` directly. That keeps three things in one place:
 * version guards, subscription lifecycles, and the multi-step call sequences
 * (lock-then-patch, transient-container-then-render) that are easy to get
 * subtly wrong when re-implemented per component.
 */
import type { ReactNode } from 'react';

/**
 * Constellation passes components an untyped accessor for their PConnect
 * object. This facade is the one place that narrowing happens, so the alias
 * stays deliberately loose here and precise on the interfaces below.
 */
export type GetPConnect = () => any;

/** Returned by subscriptions; call it to detach. Safe to call more than once. */
export type Unsubscribe = () => void;

/** Platform events, named so callers never handle raw event constants. */
export type PlatformEvent =
  | 'assignmentSubmission'
  | 'createStageSaved'
  | 'dashboardFilterChange'
  | 'dashboardFilterClearAll'
  /**
   * Published by the gallery's own widgets (`'WidgetUpdated'`) with
   * `{ widget, count, caseID }` when the number of items they show changes,
   * so a utilities panel can update its badge.
   */
  | 'widgetUpdated';

/** Payload delivered with `dashboardFilterChange`. */
export type DashboardFilterPayload = {
  filterId: string;
  filterExpression?: unknown;
};

export type SubscribeOptions = {
  /**
   * Scope the subscription to a store context. Dashboard filter events are
   * published per context; case events are global and ignore this.
   */
  context?: string;
  /** Subscription id. Defaults to a generated one, which is usually right. */
  id?: string;
};

/** Raw response from a data-object view fetch: view metadata plus its data. */
export type DetailViewResponse = {
  data: {
    data: { dataInfo?: unknown };
    uiResources?: unknown;
  };
};

export type LoadDetailViewOptions = {
  /** Data page that serves the record, e.g. `D_CaseDetails`. */
  dataPage: string;
  /** Name of the view to render from that record. */
  viewName: string;
  /** Record identifier, used both to query and to key the transient item. */
  id: string;
  /** Class the view belongs to. */
  className: string;
  /**
   * Query parameters for the data page. Defaults to `{ pyID: id }`, which is
   * what case-backed data pages expect; pass `{ caseInstanceKey: id }` for
   * data pages keyed by handle.
   */
  params?: Record<string, string>;
  /** Merged into the fetched view's config before it renders. */
  configOverrides?: Record<string, unknown>;
};

export type QueryOptions = {
  /** Named parameters, or a one-element list of them; data views accept either. */
  dataViewParameters?: Record<string, unknown> | Record<string, unknown>[];
  paging?: { pageNumber?: number; pageSize?: number };
  query?: Record<string, unknown>;
};

export interface CaseDataApi {
  /** Fetch rows from a data view by name. */
  query(dataView: string, options?: QueryOptions): Promise<unknown>;

  /**
   * Fetch rows from a data view without naming a store context.
   *
   * Calendar, GanttChart and CPQTree have always queried this way, and every
   * other caller passes its own context. Whether sending a context would
   * change what an app-wide data view returns is unconfirmed without a
   * server, so the two stay apart rather than merged.
   */
  queryUnscoped(dataView: string, options?: QueryOptions): Promise<unknown>;

  /**
   * Take the edit lock and store the etag it returns on this case's context.
   *
   * For a component that changed the case some other way (a local action
   * run in a container of its own) and needs the next write to be current.
   */
  refreshEtag(caseKey: string): Promise<void>;

  /**
   * Write field values onto a case.
   *
   * Takes the edit lock, patches with the etag that lock returned, in that
   * order — the sequence the DX API requires and the one most easily got
   * wrong. `fields` is a flat map of property name to value.
   */
  updateFields(caseKey: string, fields: Record<string, unknown>): Promise<void>;

  /** Load a data-object view payload (metadata plus data) for one record. */
  fetchDetailView(dataPage: string, viewName: string, params: Record<string, string>): Promise<DetailViewResponse>;

  /**
   * Load a case view (metadata plus case data) through the DX API.
   *
   * `context` is sent only when given: the gallery's callers differ on it,
   * and leaving it out lets the platform choose, as it did before.
   */
  loadView(options: LoadViewOptions): Promise<RestResponse>;

  /**
   * Save the open assignment's field values without submitting it.
   *
   * Sends the save with the case's current etag, then stores the etag the
   * save returns on the case context, in that order. Skipping the second
   * step makes the next save or submit fail as stale.
   */
  saveAssignment(options: SaveAssignmentOptions): Promise<void>;
}

/** A DX API response as the REST client resolves it. */
export type RestResponse = { data: any; headers: Record<string, string> };

export type LoadViewOptions = {
  /** Case handle (pzInsKey), e.g. from `caseInfo.key()`. */
  caseKey: string | undefined;
  /** Class of the case, e.g. from `caseInfo.className()`. */
  className: string | undefined;
  /** View to load, e.g. `pyCaseSummary`. */
  viewId: string;
  /** Store context to load it for. Omit to let the platform decide. */
  context?: string;
};

export type SaveAssignmentOptions = {
  /** From `caseInfo.assignmentId()`. */
  assignmentId: string | undefined;
  /** From `caseInfo.actionId()`. */
  actionId: string | undefined;
  /** The case's current etag, sent as `if-match`. */
  etag: string | undefined;
  /** Property name (no leading dot) to value, e.g. `{ Notes: 'draft' }`. */
  content: Record<string, unknown>;
};

/** Records kept behind a savable data page. */
export interface DataObjectsApi {
  /** Create a record through the savable data page. Resolves with the DX API response. */
  create(dataPage: string, data: Record<string, unknown>): Promise<RestResponse>;
  /** Update a record through the savable data page; `data` carries its key. */
  update(dataPage: string, data: Record<string, unknown>): Promise<RestResponse>;
}

export interface ViewsApi {
  /**
   * Render a record's detail view as a React element.
   *
   * Fetches the view, registers its resources, hosts it in a transient
   * container item so it has a valid context, and instantiates it — the whole
   * sequence behind an embedded detail panel.
   */
  loadDetailView(options: LoadDetailViewOptions): Promise<ReactNode>;

  /**
   * Render a record's detail view from data already in hand, with no fetch.
   *
   * The second half of `loadDetailView`: hosts `data` in a transient container
   * item keyed `${viewName}${id}` and instantiates the view on it. The view's
   * resources must already be registered (`addResources`, or an earlier load).
   */
  renderDetailView(options: RenderDetailViewOptions): ReactNode;

  /** Register the UI resources (view metadata) a DX API response carries. */
  addResources(responseData: unknown): Promise<void>;

  /**
   * The registered metadata for a view of a class, as rendering needs it.
   * Empty or missing when the view's resources were never registered.
   */
  metadata<TMeta = any>(viewName: string, className: string): TMeta;
}

export type RenderDetailViewOptions = {
  /** Name of the view to render. */
  viewName: string;
  /** Record identifier; keys the transient item and is set as the view's `pyID`. */
  id: string;
  /** Class the view belongs to. */
  className: string;
  /** What the transient item holds, e.g. `{ content: record }`. */
  data: unknown;
  /** Merged into the view's config before it renders. */
  configOverrides?: Record<string, unknown>;
};

export interface EventsApi {
  /**
   * Subscribe to a platform event.
   *
   * Returns its own unsubscribe function, so callers never have to keep the
   * event name, subscription id and context paired up themselves — return it
   * straight from a `useEffect` and the teardown is correct by construction.
   */
  on<TPayload = void>(
    event: PlatformEvent,
    handler: (payload: TPayload) => void,
    options?: SubscribeOptions,
  ): Unsubscribe;

  /** Publish a platform event, e.g. `createStageSaved` after a save for later. */
  emit(event: PlatformEvent, payload: unknown): void;
}

export type CaseUrlOptions = {
  /** Case handle (pzInsKey) to open. */
  caseKey: string;
  /** Case class name. */
  className: string;
  /** Business id (pyID) shown in the URL. */
  workId: string;
  /** Landing page within the case. Defaults to `pyDetails`. */
  page?: string;
};

export interface LinksApi {
  /** Build a portal deep link that opens a case by handle. */
  caseUrl(options: CaseUrlOptions): string;

  /**
   * Build a link that opens a case by its class and business id alone.
   *
   * Sends only those two to the platform, without the page and handle that
   * `caseUrl` adds: the link Calendar, CPQTree, NetworkDiagram, Scheduler and
   * UtilityList have always built. The two produce different URLs.
   */
  workUrl(options: { className: string; workId: string }): string;

  /** Build a link that shows a portal page (a landing page) by name. */
  pageUrl(pageName: string): string;
}

export interface CaseActionsApi {
  /** Open a case in the current container. */
  open(caseKey: string, className: string): void;
  /** Open a case in the preview panel instead of taking over the page. */
  preview(caseKey: string, className: string): void;
}

/**
 * What `addPageListNode(contextName, pageName, viewName, pageListName)` takes,
 * named. The platform's own example: page `caseInfo.content`, view
 * `TOP_EmbeddedData_5`, list `.EmbeddedData`.
 */
export type RegisterPageListOptions = {
  /** Page reference the list hangs off, e.g. `caseInfo.content`. */
  pageReference: string;
  /** View that renders the list; in the gallery, `getPConnect().meta.name`. */
  viewName: string;
  /** Property path of the page list, e.g. `.Items`. */
  pageListName: string;
  /**
   * The list's node description, sent as the fifth argument when given.
   * CPQTree passes one (`type: 'multirecordlist'`, `referenceList`, …) for
   * lists nested inside other lists; the gallery's other callers do not.
   */
  node?: Record<string, unknown>;
};

export type RegisterViewOptions = {
  /** Full page reference of the view node, e.g. `caseInfo.content.Tree[0]`. */
  pageReference: string;
  /** View that renders it. */
  viewName: string;
};

export interface ContextTreeApi {
  /**
   * Register a page-list node so embedded rows resolve a store context.
   *
   * No-ops when the running platform predates the context-tree manager,
   * which is why callers do not need their own existence check.
   */
  registerPageList(options: RegisterPageListOptions): void;
  /** Register a view node, so fields on a nested page resolve. No-ops like `registerPageList`. */
  registerView(options: RegisterViewOptions): void;
  /** Whether the running platform exposes the context tree at all. */
  readonly available: boolean;
}

export interface TextApi {
  /** Translate a value from a locale bundle. */
  locale(value: string, bundle: string, path: string): string;
  /**
   * The platform's standard "Loading content..." string.
   *
   * Its three-argument bundle lookup is repeated verbatim in 13 components;
   * this is that one incantation, named.
   */
  loadingContent(): string;
}

/** One entry of a case's available actions, as the platform lists them. */
export type CaseAction = { ID: string; name?: string; type?: string };

/**
 * Facts about the case the component is rendered in.
 *
 * Each read goes to the store when called, never cached, because the values
 * change under a mounted component: a save moves the assignment on, and a
 * refresh swaps the case data. Read inside the handler or effect that needs
 * the value, not once at render.
 *
 * On a page with no case behind it, reads return whatever the store holds
 * for the path (typically `undefined`), and nothing throws. Values are passed
 * through unchanged, so `''` stays `''` and `undefined` stays `undefined`;
 * callers that send them to a data page get the same payload as before.
 */
export interface CaseInfoApi {
  /** Case handle (pzInsKey), e.g. `ORG-APP-WORK T-1`. The `caseKey` the other APIs take. */
  key(): string | undefined;
  /** Class of the case, e.g. `ORG-App-Work-Claim`. */
  className(): string | undefined;
  /** Id of the case type. */
  caseTypeId(): string | undefined;
  /** Id of the assignment being worked on, when there is one. */
  assignmentId(): string | undefined;
  /**
   * The flow action being rendered: the active action, or, when none is
   * active, the assignment's own action. Saving an assignment needs this id,
   * and the fallback is easy to forget.
   */
  actionId(): string | undefined;
  /** Actions the current operator may run on the case. Always an array. */
  availableActions<TAction = CaseAction>(): TAction[];
  /** The main and secondary buttons of the current assignment. */
  actionButtons<TButtons = unknown>(): TButtons | undefined;
  /** The whole `caseInfo` object, for the rare field not named above. */
  raw<TCaseInfo = Record<string, unknown>>(): TCaseInfo | undefined;
}

/**
 * How to scope to a page. Every option but `context` is sent to the platform
 * only when given, so a call sends exactly the options its caller names: the
 * gallery's call sites differ in which ones they pass, and filling in the rest
 * would change what each one sends. An option given as `undefined` counts as
 * not given; the platform reads a missing option as `undefined` either way.
 */
export type PageScopeOptions = {
  /** Metadata the scoped PConnect is created from: the component's props, or the metadata it renders. */
  meta: unknown;
  /** Store context. Defaults to this component's context. */
  context?: string;
  /** Context name, when it must be set apart from `context` (transient containers). */
  contextName?: string;
  /** Render target, usually `getPConnect().getTarget()`. */
  target?: string;
  /** The embedded list the page belongs to, e.g. `.Items`; list actions act on it. */
  referenceList?: string;
  /** The view the page renders in. */
  viewName?: string;
  /** Whether the page renders inside a form. */
  hasForm?: boolean;
  /** Row index within `referenceList`; a list insert reads it from the environment. */
  index?: number;
};

/** The actions the gallery runs against a scoped page. */
export interface PageActions {
  /** Write a property on the scoped page, e.g. `.IsSelected` on one row. */
  updateFieldValue(property: string, value: unknown): void;
  /** Tell the platform the property changed, which runs its change handling (validation, refresh). */
  triggerFieldChange(property: string, value: unknown): void;
  /** Submit the assignment rendered in the scoped context. */
  finishAssignment(context: string, options: { outcomeID: string; jsActionQueryParams: object }): Promise<unknown>;
}

/** Row operations on the list named by `referenceList`. */
export interface PageListActions {
  insert(row: object, index: number): void;
  deleteEntry(index: number): void;
}

/** A page other than the component's own, with a PConnect of its own. */
export interface PageScope {
  /** Actions that write to this page rather than the component's own. */
  readonly actions: PageActions;
  /** Row operations on the scope's `referenceList`. */
  readonly listActions: PageListActions;
  /** Context the scoped PConnect resolved to. */
  readonly contextName: string;
  /** Render metadata (a field, a view) on this page. */
  render(meta: unknown): ReactNode;
}

export interface PagesApi {
  /**
   * Scope to another page in the store: a row of an embedded list, an
   * embedded page, a field's own page.
   *
   * A component can only write to and render on its own page. Reaching a row
   * of a list needs a PConnect created for that row, which is what this does.
   */
  at(pageReference: string, options: PageScopeOptions): PageScope;
}

export type DataPageReadOptions = {
  /** Skip the platform's cache and ask the server again. */
  fresh?: boolean;
};

/** Single-page data pages (`getPageDataAsync`), read in this component's context. */
export interface DataPagesApi {
  /** Read a single-page data page. Resolves with the page itself. */
  read<TPage = any>(
    dataPage: string,
    parameters?: Record<string, unknown>,
    options?: DataPageReadOptions,
  ): Promise<TPage>;
  /** Whether the running platform can read data pages at all. */
  readonly available: boolean;
}

/** Server-pushed messages over the platform's WebSocket channel. */
export interface MessagingApi {
  /**
   * Run `handler` whenever the server pushes a message matching `filter`,
   * e.g. `{ matcher: 'ATTACHMENTS', criteria: { ID: caseKey } }`.
   * Returns its own unsubscribe, like `events.on`.
   */
  subscribe(filter: unknown, handler: (message?: unknown) => void): Unsubscribe;
}

export type UploadOptions = {
  onProgress?: (event: unknown) => void;
  onError?: (error: unknown) => void;
};

/** Case attachments, in this component's context. */
export interface AttachmentsApi {
  /** The attachments on a case. */
  forCase<TAttachment = any>(caseKey: string): Promise<TAttachment[]>;
  /** Download one attachment's content. */
  download(attachmentId: string, responseType?: string): Promise<{ data: any; headers: Record<string, string> }>;
  /**
   * Upload a file. It is not on any case yet: pass the returned `ID` to
   * `linkToCase`. Rejects, or resolves without an `ID`, when the upload failed.
   */
  upload(file: File, options?: UploadOptions): Promise<{ ID?: string } & Record<string, unknown>>;
  /** Link uploaded files (each carrying the `ID` from `upload`) to a case. */
  linkToCase(caseKey: string, files: unknown[], type: string): Promise<void>;
}

/** Platform components that load on demand. */
export interface ComponentsApi {
  /**
   * Call `onReady` once a component type can render: straight away when it is
   * already loaded (or no type is given), else after the loader fetches it.
   * Templates count `onReady` calls to know when every column can render.
   */
  whenAvailable(componentType: string | undefined, onReady: () => void): void;
}

/** The redux store behind the platform, for the reads PConnect does not offer. */
export interface StoreApi {
  /** Everything the store holds for a context (default: this component's). */
  contextData<TData = any>(context?: string): TData | undefined;
  /** Set a value at a reference within a context, as the platform's own SET_PROPERTY does. */
  setProperty(reference: string, value: unknown, context?: string): void;
  /** Whether the running platform exposes the store. */
  readonly available: boolean;
}

/** Container items: the case, assignment and modal views a container holds. */
export interface ContainersApi {
  /** Every item in a container (e.g. `app/primary`), by context name, oldest first. */
  items(target: string): Record<string, unknown>;
  /** The item this component renders in. */
  currentItem<TItem = any>(): TItem | undefined;
}

/** Facts about the operator's session. Each read is optional-chained: off-platform they return undefined. */
export interface EnvironmentApi {
  /** The locale the portal renders in. */
  locale(): string | undefined;
  /** The operator's chosen locale. */
  useLocale(): string | undefined;
  /** The operator's time zone. */
  timeZone(): string | undefined;
  /** The operator's id. */
  operatorId(): string | undefined;
}

/** Field change notifications (the platform's cascade manager). */
export interface FieldsApi {
  /**
   * Call `handler` whenever one of `properties` changes on this component's page.
   * Returns the matching teardown; the registration id stays inside.
   */
  onChange(properties: string[], handler: () => void): Unsubscribe;
}

/** Form validation. */
export interface FormsApi {
  /** Whether the form on a page of a context is valid; runs the platform's validation. */
  isValid(context: string, pageReference: string): boolean;
}

/** The full platform surface handed to a component. */
export interface Platform {
  /** Store context path this component is bound to. */
  readonly context: string;
  readonly caseData: CaseDataApi;
  readonly caseInfo: CaseInfoApi;
  readonly dataObjects: DataObjectsApi;
  readonly pages: PagesApi;
  readonly text: TextApi;
  readonly views: ViewsApi;
  readonly events: EventsApi;
  readonly links: LinksApi;
  readonly caseActions: CaseActionsApi;
  readonly contextTree: ContextTreeApi;
  readonly dataPages: DataPagesApi;
  readonly messaging: MessagingApi;
  readonly attachments: AttachmentsApi;
  readonly components: ComponentsApi;
  readonly store: StoreApi;
  readonly containers: ContainersApi;
  readonly environment: EnvironmentApi;
  readonly fields: FieldsApi;
  readonly forms: FormsApi;
}
