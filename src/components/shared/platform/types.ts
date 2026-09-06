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
  fetchDetailView(
    dataPage: string,
    viewName: string,
    params: Record<string, string>,
  ): Promise<DetailViewResponse>;
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

export type RegisterPageListOptions = {
  /** Property path of the page list, e.g. `.Items`. */
  pageListName: string;
  /** Class of the rows in that list. */
  className: string;
  /** Page reference the list hangs off. */
  pageReference: string;
  /** View name rendered for each row, when there is one. */
  viewName?: string;
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

/** The full platform surface handed to a component. */
export interface Platform {
  /** Store context path this component is bound to. */
  readonly context: string;
  readonly caseData: CaseDataApi;
  readonly text: TextApi;
  readonly views: ViewsApi;
  readonly events: EventsApi;
  readonly links: LinksApi;
  readonly caseActions: CaseActionsApi;
  readonly contextTree: ContextTreeApi;
}
