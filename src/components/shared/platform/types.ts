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
  | 'dashboardFilterClearAll';

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
  dataViewParameters?: Record<string, unknown>;
  paging?: { pageNumber?: number; pageSize?: number };
  query?: Record<string, unknown>;
};

export interface CaseDataApi {
  /** Fetch rows from a data view by name. */
  query(dataView: string, options?: QueryOptions): Promise<unknown>;

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
}

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
};

export interface ContextTreeApi {
  /**
   * Register a page-list node so embedded rows resolve a store context.
   *
   * No-ops when the running platform predates the context-tree manager,
   * which is why callers do not need their own existence check.
   */
  registerPageList(options: RegisterPageListOptions): void;
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
}
