/**
 * A single configurable double for the platform globals, shared by stories
 * and tests.
 *
 * Before this existed, 44 of the gallery's components each hand-rolled their
 * own nested `window.PCore` stub inside `demo.stories.tsx`. Those stubs drift
 * from the real API and from each other, and they record nothing, so a test
 * cannot assert that a component unsubscribed or wrote the fields it claimed.
 *
 * Usage in a story:
 *   const platform = installPlatformFake({ detailData: { pyID: 'C-1' } });
 * Usage in a test:
 *   const platform = installPlatformFake();
 *   ...
 *   expect(platform.calls.fieldUpdates).toEqual([{ caseKey: 'C-1', fields: { pyStatus: 'Open' } }]);
 *   platform.restore();
 */
import { createElement, type ReactNode } from 'react';
import type { GetPConnect } from './types';

export type FieldUpdate = { caseKey: string; fields: Record<string, unknown> };
export type FakeViewMeta = { name: string; config: Record<string, any> };
export type Subscription = { event: string; id: string; active: boolean };

export type PlatformFakeOptions = {
  /** Rows returned by `caseData.query`. */
  rows?: unknown[];
  /** `dataInfo` payload returned when a detail view is fetched. */
  detailData?: unknown;
  /** Etag handed back by the edit lock. */
  etag?: string;
  /**
   * What a rendered detail view, or metadata rendered on a scoped page,
   * should look like. Receives the metadata, whose `config` carries the record
   * id or field, and the options the PConnect was created with, whose
   * `pageReference` says which row, so a story can render real content.
   * Defaults to a marker node.
   */
  renderView?: (meta: FakeViewMeta, options: Record<string, any>) => ReactNode;
  /** Set false to simulate a platform without the context tree manager. */
  contextTreeAvailable?: boolean;
  /** Context name reported by the fake PConnect. */
  contextName?: string;
  /** Extra or replacement methods on the fake PConnect. */
  pConnect?: Record<string, unknown>;
  /**
   * Extra or replacement methods on the fake actions API — where a story
   * hooks up something visible, such as alerting on `createWork`.
   */
  actions?: Record<string, unknown>;
  /**
   * The case the component is rendered in, as `platform.caseInfo` reads it.
   * Omit for a page with no case.
   */
  caseInfo?: FakeCaseInfo;
  /**
   * What the REST client resolves with, by endpoint (`loadView`, `save`,
   * `createDataObject`, …). Unlisted endpoints resolve with an empty response.
   */
  restResponses?: Record<string, { data?: unknown; headers?: Record<string, string> }>;
  /** Make `caseData.query` reject with this error, for a component's error state. */
  queryError?: Error;
  /**
   * The redux store's `data`, keyed by context name, as `getStore().getState()`
   * returns it, e.g. `{ 'app/primary_1': { caseInfo: { content: { … } } } }`.
   */
  store?: Record<string, unknown>;
  /**
   * Further values `getPConnect().getValue(path)` returns, by path, beside the
   * caseInfo ones, e.g. `{ 'caseInfo.headers.etag': 'e-1', '.Notes': 'draft' }`.
   */
  values?: Record<string, unknown>;
  /** What `getContainerUtils().getContainerItemData(target, context)` returns, by context. */
  containerItems?: Record<string, unknown>;
};

/** One field per `platform.caseInfo` read, plus the two `actionId` chooses between. */
export type FakeCaseInfo = {
  key?: string;
  className?: string;
  caseTypeId?: string;
  assignmentId?: string;
  activeActionId?: string;
  assignmentActionId?: string;
  availableActions?: unknown[];
  actionButtons?: unknown;
  raw?: unknown;
};

/**
 * The fake's CASE_INFO path constants. The real values belong to the platform;
 * these only need to be distinct, so that a facade member reading the wrong
 * constant reads the wrong value and a test sees it.
 */
const CASE_INFO = {
  CASE_INFO: 'caseInfo',
  CASE_INFO_ID: 'caseInfo.ID',
  CASE_INFO_CLASSID: 'caseInfo.classID',
  CASE_TYPE_ID: 'caseInfo.caseTypeID',
  ASSIGNMENT_ID: 'caseInfo.assignmentID',
  ACTIVE_ACTION_ID: 'caseInfo.activeActionID',
  ASSIGNMENTACTION_ID: 'caseInfo.assignmentActionID',
  AVAILABLEACTIONS: 'caseInfo.availableActions',
  ACTION_BUTTONS: 'caseInfo.actionButtons',
};

/** Store contents keyed by path, as `getValue` resolves them. */
const caseInfoValues = (caseInfo: FakeCaseInfo = {}): Record<string, unknown> => {
  const byPath: [string, unknown][] = [
    [CASE_INFO.CASE_INFO_ID, caseInfo.key],
    [CASE_INFO.CASE_INFO_CLASSID, caseInfo.className],
    [CASE_INFO.CASE_TYPE_ID, caseInfo.caseTypeId],
    [CASE_INFO.ASSIGNMENT_ID, caseInfo.assignmentId],
    [CASE_INFO.ACTIVE_ACTION_ID, caseInfo.activeActionId],
    [CASE_INFO.ASSIGNMENTACTION_ID, caseInfo.assignmentActionId],
    [CASE_INFO.AVAILABLEACTIONS, caseInfo.availableActions],
    [CASE_INFO.ACTION_BUTTONS, caseInfo.actionButtons],
    [CASE_INFO.CASE_INFO, caseInfo.raw],
  ];
  return Object.fromEntries(byPath.filter(([, value]) => value !== undefined));
};

/** One call made through a scoped page's `actions` or `listActions`. */
export type PageCall = {
  pageReference: string;
  api: 'actions' | 'listActions';
  method: string;
  args: unknown[];
};

/** One registration with the cascade manager. */
export type CascadeRegistration = {
  context: string;
  pageReference: string;
  fields: string[];
  id: unknown;
  /** False once the same callback and id are unregistered. */
  active: boolean;
  /** Fire the registered callback, as a change to one of the fields would. */
  notify: () => void;
};

export type PlatformFake = {
  /**
   * A `getPConnect` wired into the same recorder, so PConnect-side actions
   * (opening a case, hosting a transient view) are captured alongside the
   * PCore-side ones. Pass it straight to the component under test.
   */
  getPConnect: GetPConnect;
  /** Everything the component did, in order, for assertions. */
  calls: {
    fieldUpdates: FieldUpdate[];
    queries: { dataView: string; options: unknown }[];
    detailViews: { dataPage: string; viewName: string; params: unknown }[];
    subscriptions: Subscription[];
    openedCases: { caseKey: string; className: string }[];
    localActions: { caseKey: string; action: string }[];
    createdCases: { className: string }[];
    previewedCases: { caseKey: string; className: string }[];
    fieldValues: { property: string; value: unknown }[];
    registeredPageLists: unknown[][];
    /**
     * Each PConnect created, by `pages.at` or to host a detail view: the page,
     * the exact options sent, and the env (for `index`).
     */
    pages: { pageReference: string; options: Record<string, unknown>; env: { index?: number } }[];
    /** Every action or list action run against a scoped page. */
    pageCalls: PageCall[];
    /** Every REST call: endpoint, payload, and the exact arguments passed. */
    restCalls: { endpoint: string; payload: any; args: unknown[] }[];
    /** Etags stored on a case context after a write. */
    etagUpdates: { context: string; etag: string }[];
    /** Components asked of the asset loader. */
    loadedComponents: string[];
    /** Actions dispatched to the redux store. */
    dispatched: unknown[];
    /**
     * Fields registered with the cascade manager. `notify()` fires the
     * callback, as the platform does when one of the fields changes.
     */
    cascades: CascadeRegistration[];
  };
  /** True when every subscription taken out has been detached again. */
  allUnsubscribed(): boolean;
  /** Remove the fake global. Call from `afterEach`. */
  restore(): void;
};

type Recorder = PlatformFake['calls'];

const buildGetPConnect = (
  calls: Recorder | null,
  overrides: Record<string, unknown>,
  contextName: string,
  actionOverrides: Record<string, unknown> = {},
  values: Record<string, unknown> = {},
): GetPConnect => {
  const containerManager = {
    addTransientItem: () => 'transient-1',
    updateTransientData: () => {},
    addContainerItem: () => {},
    removeContainerItem: () => {},
  };
  const actionsApi = {
    openWorkByHandle: (caseKey: string, className: string) => {
      calls?.openedCases.push({ caseKey, className });
    },
    openLocalAction: (action: string, options: any) => {
      calls?.localActions.push({ caseKey: options?.caseID ?? '', action });
    },
    createWork: (className: string) => {
      calls?.createdCases.push({ className });
    },
    refreshCaseView: () => {},
    finishAssignment: () => Promise.resolve({ data: { data: {} } }),
    showCasePreview: (caseKey: string, options: any) => {
      calls?.previewedCases.push({ caseKey, className: options?.caseClassName });
    },
    updateFieldValue: (property: string, value: unknown) => {
      calls?.fieldValues.push({ property, value });
    },
    triggerFieldChange: () => {},
  };
  const actions = { ...actionsApi, ...actionOverrides };
  /* What setInheritedProp has recorded; getInheritedProps reads it back, as
     the platform does, so a template marking a region read-only is visible. */
  const inherited: Record<string, unknown> = {};
  /* Defaults cover the PConnect surface the gallery actually uses, so most
     components need no overrides at all. */
  const pConnect = {
    getContextName: () => contextName,
    getContainerName: () => 'primary',
    getLocalizedValue: (value: string) => value,
    getLocalizationService: () => ({ getLocaleValue: (value: string) => value }),
    getContainerManager: () => containerManager,
    getActionsApi: () => actions,
    getActions: () => actions,
    /* Answers by path, so a read of the wrong path gets the wrong value. Paths
       nothing was supplied for read as '', as they always have. */
    getValue: (path: string) => (path in values ? values[path] : ''),
    getStateProps: () => ({ value: '.value' }),
    getConfigProps: () => ({}),
    getRawMetadata: () => ({ config: {} }),
    getPageReference: () => 'caseInfo.content',
    getTarget: () => contextName,
    getInheritedProps: () => ({ ...inherited }),
    getChildren: () => [],
    getDataObject: () => ({}),
    getCaseInfo: () => ({
      getKey: () => 'CASE-1',
      getClassName: () => 'Work-Sample',
      getAssignmentID: () => 'ASSIGN-1',
      getCurrentAssignmentViewName: () => 'Details',
    }),
    getListActions: () => ({
      insert: () => {},
      deleteEntry: () => {},
      update: () => {},
    }),
    getValidationApi: () => ({ validate: () => true }),
    createComponent: () => null,
    updateState: () => {},
    ignoreSuggestion: () => {},
    acceptSuggestion: () => {},
    setInheritedProps: () => {},
    setInheritedProp: (name: string, value: unknown) => {
      inherited[name] = value;
    },
    resolveConfigProps: () => {},
    ...overrides,
  };
  return () => pConnect;
};

/**
 * A minimal `getPConnect` for components that never touch `PCore`.
 * It does not record; use `installPlatformFake().getPConnect` when you need
 * to assert on what the component did.
 */
export const createFakeGetPConnect = (
  overrides: Record<string, unknown> = {},
  contextName = 'app/primary_1',
): GetPConnect => buildGetPConnect(null, overrides, contextName);

/**
 * Install the fake `PCore` global. Returns a handle recording what the
 * component did, plus `restore()`.
 */
export const installPlatformFake = (options: PlatformFakeOptions = {}): PlatformFake => {
  const {
    rows = [],
    detailData = {},
    etag = 'etag-1',
    renderView = (meta: FakeViewMeta) => createElement('div', { 'data-testid': 'detail-view' }, meta.name),
    contextTreeAvailable = true,
    contextName = 'app/primary_1',
    pConnect = {},
    actions = {},
    caseInfo,
    restResponses = {},
    queryError,
    store = {},
    values = {},
    containerItems = {},
  } = options;

  const calls: PlatformFake['calls'] = {
    fieldUpdates: [],
    queries: [],
    detailViews: [],
    subscriptions: [],
    openedCases: [],
    localActions: [],
    createdCases: [],
    previewedCases: [],
    fieldValues: [],
    registeredPageLists: [],
    pages: [],
    pageCalls: [],
    restCalls: [],
    etagUpdates: [],
    loadedComponents: [],
    dispatched: [],
    cascades: [],
  };

  const previous = (window as any).PCore;

  /* Records every method called on it, whatever its name, so a scoped page's
     actions and list actions need no per-method stubs. `then` is left
     undefined so the object is never mistaken for a promise. */
  const recordingApi = (pageReference: string, api: PageCall['api']) =>
    new Proxy(
      {},
      {
        get: (_target, method) => {
          if (typeof method !== 'string' || method === 'then') return undefined;
          return (...args: unknown[]) => {
            calls.pageCalls.push({ pageReference, api, method, args });
            return Promise.resolve({});
          };
        },
      },
    );

  const dataApiUtils = {
    getData: (dataView: string, opts: unknown) => {
      calls.queries.push({ dataView, options: opts });
      return queryError ? Promise.reject(queryError) : Promise.resolve({ data: { data: rows } });
    },
    getCaseEditLock: () => Promise.resolve({ headers: { etag } }),
    updateCaseEditFieldsData: (caseKey: string, payload: any) => {
      calls.fieldUpdates.push({ caseKey, fields: payload[caseKey] });
      return Promise.resolve({ data: {} });
    },
    getDataObjectView: (dataPage: string, viewName: string, params: unknown) => {
      calls.detailViews.push({ dataPage, viewName, params });
      return Promise.resolve({ data: { data: { dataInfo: detailData } } });
    },
  };

  const fake: any = {
    getDataApiUtils: () => dataApiUtils,

    getCascadeManager: () => ({
      registerFields: (context: string, pageReference: string, fields: string[], callback: () => void, id: unknown) => {
        calls.cascades.push({ context, pageReference, fields, id, active: true, notify: callback });
      },
      unRegisterFields: (
        _context: string,
        _pageReference: string,
        _fields: string[],
        callback: () => void,
        id: unknown,
      ) => {
        calls.cascades
          .filter((registration) => registration.notify === callback && registration.id === id)
          .forEach((registration) => {
            registration.active = false;
          });
      },
    }),

    /* Every component counts as loaded, so a layout never waits on the loader. */
    getComponentsRegistry: () => ({ getLazyComponent: (name: string) => name }),

    getAssetLoader: () => ({
      getLoader: () => (components: string[]) => {
        calls.loadedComponents.push(...components);
        return Promise.resolve();
      },
    }),

    getRestClient: () => ({
      invokeRestApi: (...args: unknown[]) => {
        const [endpoint, payload] = args as [string, any];
        calls.restCalls.push({ endpoint, payload, args });
        const response = restResponses[endpoint] ?? {};
        return Promise.resolve({ data: response.data ?? {}, headers: response.headers ?? {} });
      },
    }),

    getContainerUtils: () => ({
      getContainerItemData: (_target: string, context: string) => containerItems[context],
      updateCaseContextEtag: (context: string, newEtag: string) => {
        calls.etagUpdates.push({ context, etag: newEtag });
      },
    }),

    getViewResources: () => ({
      updateViewResources: () => Promise.resolve(),
      fetchViewResources: (viewName: string) => ({ name: viewName, config: {} }),
    }),

    /* Serves both uses: hosting a detail view (createComponent) and scoping to
       a page (actions, list actions), which it records. */
    createPConnect: (config: any) => {
      const pageOptions = config?.options ?? {};
      const pageReference: string = pageOptions.pageReference ?? '';
      const env: { index?: number; getPConnect: () => unknown } = {
        getPConnect: () => ({
          createComponent: (meta?: FakeViewMeta) => renderView(meta ?? config.meta, pageOptions),
          getContextName: () => pageOptions.contextName ?? pageOptions.context ?? contextName,
          getActionsApi: () => recordingApi(pageReference, 'actions'),
          getListActions: () => recordingApi(pageReference, 'listActions'),
        }),
      };
      calls.pages.push({ pageReference, options: pageOptions, env });
      return env;
    },

    getEvents: () => ({
      getCaseEvent: () => ({ ASSIGNMENT_SUBMISSION: 'ASSIGNMENT_SUBMISSION' }),
    }),

    getConstants: () => ({
      CASE_INFO,
      PUB_SUB_EVENTS: {
        CASE_EVENTS: { CREATE_STAGE_SAVED: 'CREATE_STAGE_SAVED' },
        EVENT_DASHBOARD_FILTER_CHANGE: 'DASHBOARD_FILTER_CHANGE',
        EVENT_DASHBOARD_FILTER_CLEAR_ALL: 'DASHBOARD_FILTER_CLEAR_ALL',
      },
    }),

    getPubSubUtils: () => ({
      subscribe: (event: string, _handler: () => void, id: string) => {
        calls.subscriptions.push({ event, id, active: true });
      },
      unsubscribe: (event: string, id: string) => {
        const found = calls.subscriptions.find((s) => s.event === event && s.id === id);
        if (found) found.active = false;
      },
      publish: () => {},
    }),

    getSemanticUrlUtils: () => ({
      getActions: () => ({ ACTION_OPENWORKBYHANDLE: 'openWorkByHandle' }),
      getResolvedSemanticURL: (_action: string, classInfo: any, workInfo: any) =>
        `/case/${classInfo.caseClassName}/${workInfo.workID}`,
    }),

    getLocaleUtils: () => ({
      /* Identity translation keeps assertions readable. */
      getLocaleValue: (value: string) => value,
    }),

    getStore: () => ({
      getState: () => ({ data: store }),
      dispatch: (action: unknown) => {
        calls.dispatched.push(action);
      },
    }),
  };

  if (contextTreeAvailable) {
    fake.getContextTreeManager = () => ({
      addPageListNode: (...args: unknown[]) => {
        calls.registeredPageLists.push(args);
      },
      addViewNode: () => {},
    });
  }

  (window as any).PCore = fake;

  return {
    getPConnect: buildGetPConnect(calls, pConnect, contextName, actions, { ...values, ...caseInfoValues(caseInfo) }),
    calls,
    allUnsubscribed: () => calls.subscriptions.every((s) => !s.active),
    restore: () => {
      (window as any).PCore = previous;
    },
  };
};
