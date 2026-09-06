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
   * What a rendered detail view should look like. Receives the view metadata,
   * whose `config` carries the record id, so a story can render real content.
   * Defaults to a marker node.
   */
  renderView?: (meta: FakeViewMeta) => ReactNode;
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
    getValue: () => '',
    getStateProps: () => ({ value: '.value' }),
    getConfigProps: () => ({}),
    getRawMetadata: () => ({ config: {} }),
    getPageReference: () => 'caseInfo.content',
    getTarget: () => contextName,
    getInheritedProps: () => ({}),
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
  };

  const previous = (window as any).PCore;

  const dataApiUtils = {
    getData: (dataView: string, opts: unknown) => {
      calls.queries.push({ dataView, options: opts });
      return Promise.resolve({ data: { data: rows } });
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

    getViewResources: () => ({
      updateViewResources: () => Promise.resolve(),
      fetchViewResources: (viewName: string) => ({ name: viewName, config: {} }),
    }),

    createPConnect: (config: any) => ({
      getPConnect: () => ({
        createComponent: () => renderView(config.meta),
        getContextName: () => contextName,
      }),
    }),

    getEvents: () => ({
      getCaseEvent: () => ({ ASSIGNMENT_SUBMISSION: 'ASSIGNMENT_SUBMISSION' }),
    }),

    getConstants: () => ({
      CASE_INFO: {
        CASE_INFO_ID: 'caseInfo.ID',
        CASE_INFO_CLASSID: 'caseInfo.classID',
        AVAILABLEACTIONS: 'caseInfo.availableActions',
      },
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
        const found = calls.subscriptions.find(s => s.event === event && s.id === id);
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

    getStore: () => ({ getState: () => ({ data: {} }), dispatch: () => {} }),
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
    getPConnect: buildGetPConnect(calls, pConnect, contextName, actions),
    calls,
    allUnsubscribed: () => calls.subscriptions.every(s => !s.active),
    restore: () => {
      (window as any).PCore = previous;
    },
  };
};
