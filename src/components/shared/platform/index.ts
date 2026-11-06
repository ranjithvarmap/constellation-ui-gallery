/**
 * Real implementation of the platform facade, backed by the `PCore` global
 * and the component's own `PConnect`.
 *
 * This is the only module in the gallery that should reference
 * `(window as any).PCore`. Everything else goes through {@link Platform}.
 */
import type {
  CaseActionsApi,
  CaseDataApi,
  CaseInfoApi,
  PlatformEvent,
  SubscribeOptions,
  TextApi,
  CaseUrlOptions,
  ContextTreeApi,
  DetailViewResponse,
  EventsApi,
  GetPConnect,
  LinksApi,
  LoadDetailViewOptions,
  Platform,
  QueryOptions,
  RegisterPageListOptions,
  Unsubscribe,
  ViewsApi,
} from './types';

export * from './types';

/** Narrow access to the platform global, in one place. */
const pcore = (): any => (window as any).PCore;

/** Maps our event names onto the platform's event constants. */
const eventConstant = (event: PlatformEvent): string => {
  const pubSubEvents = pcore().getConstants().PUB_SUB_EVENTS;
  switch (event) {
    case 'assignmentSubmission':
      return pcore().getEvents().getCaseEvent().ASSIGNMENT_SUBMISSION;
    case 'createStageSaved':
      return pubSubEvents.CASE_EVENTS.CREATE_STAGE_SAVED;
    case 'dashboardFilterChange':
      return pubSubEvents.EVENT_DASHBOARD_FILTER_CHANGE;
    case 'dashboardFilterClearAll':
      return pubSubEvents.EVENT_DASHBOARD_FILTER_CLEAR_ALL;
    /* istanbul ignore next - exhaustive over the union */
    default:
      throw new Error(`Unknown platform event: ${event}`);
  }
};

const createCaseData = (getPConnect: GetPConnect, context: () => string): CaseDataApi => ({
  query: (dataView: string, options: QueryOptions = {}) =>
    pcore().getDataApiUtils().getData(dataView, options, context()),

  updateFields: async (caseKey: string, fields: Record<string, unknown>) => {
    const lock = await pcore().getDataApiUtils().getCaseEditLock(caseKey, context());
    const payload: Record<string, unknown> = { [caseKey]: { ...fields } };
    await pcore()
      .getDataApiUtils()
      .updateCaseEditFieldsData(caseKey, payload, lock.headers.etag, context());
  },

  fetchDetailView: (dataPage: string, viewName: string, params: Record<string, string>) =>
    pcore().getDataApiUtils().getDataObjectView(dataPage, viewName, params) as Promise<DetailViewResponse>,
});

const createViews = (getPConnect: GetPConnect, caseData: CaseDataApi): ViewsApi => ({
  loadDetailView: async ({
    dataPage,
    viewName,
    id,
    className,
    params,
    configOverrides,
  }: LoadDetailViewOptions) => {
    const response = await caseData.fetchDetailView(dataPage, viewName, params ?? { pyID: id });

    const { fetchViewResources, updateViewResources } = pcore().getViewResources();
    await updateViewResources(response.data);

    /* Host the view in a transient container item so it resolves a context of
       its own — it is not backed by an assignment. */
    const containerManager = getPConnect().getContainerManager();
    const transientItemID = containerManager.addTransientItem({
      id: `${viewName}${id}`,
      data: {},
    });
    containerManager.updateTransientData({
      transientItemID,
      data: response.data.data.dataInfo,
    });

    const viewConfig = {
      meta: fetchViewResources(viewName, getPConnect(), className),
      options: {
        contextName: transientItemID,
        context: transientItemID,
        pageReference: 'content',
      },
    };
    Object.assign(viewConfig.meta.config, { showLabel: false, pyID: id }, configOverrides ?? {});

    const c11nEnv = pcore().createPConnect(viewConfig);
    return c11nEnv.getPConnect().createComponent(viewConfig.meta);
  },
});

const createEvents = (): EventsApi => ({
  on: <TPayload,>(
    event: PlatformEvent,
    handler: (payload: TPayload) => void,
    options: SubscribeOptions = {},
  ): Unsubscribe => {
    const eventName = eventConstant(event);
    /* The id only has to be unique per event, so deriving it here means
       callers cannot mismatch subscribe and unsubscribe. */
    const subscriptionId = options.id ?? `platform-${event}-${Math.random().toString(36).slice(2)}`;
    const context = options.context;

    if (context) {
      pcore().getPubSubUtils().subscribe(eventName, handler, subscriptionId, false, context);
    } else {
      pcore().getPubSubUtils().subscribe(eventName, handler, subscriptionId);
    }

    let detached = false;
    return () => {
      if (detached) return;
      detached = true;
      if (context) {
        pcore().getPubSubUtils().unsubscribe(eventName, subscriptionId, context);
      } else {
        pcore().getPubSubUtils().unsubscribe(eventName, subscriptionId);
      }
    };
  },
});

/**
 * Reads go through `getValue` with the platform's CASE_INFO path constants:
 * exactly what the gallery's components did by hand, so moving a component
 * onto this member changes no behaviour. PConnect also offers native
 * accessors (`getCaseInfo().getKey()` and friends); switching to those is a
 * change to make here, once, after confirming on a server that they agree.
 */
const createCaseInfo = (getPConnect: GetPConnect): CaseInfoApi => {
  const read = (field: string) => getPConnect().getValue(pcore().getConstants().CASE_INFO[field]);

  return {
    key: () => read('CASE_INFO_ID'),
    className: () => read('CASE_INFO_CLASSID'),
    caseTypeId: () => read('CASE_TYPE_ID'),
    assignmentId: () => read('ASSIGNMENT_ID'),
    actionId: () => read('ACTIVE_ACTION_ID') || read('ASSIGNMENTACTION_ID'),
    availableActions: () => read('AVAILABLEACTIONS') || [],
    actionButtons: () => read('ACTION_BUTTONS'),
    raw: () => read('CASE_INFO'),
  };
};

/* The bundle and path the platform uses for its own generic UI strings. */
const GENERIC_BUNDLE = 'Generic';
const GENERIC_PATH = '@BASECLASS!GENERIC!PYGENERICFIELDS';

const createText = (): TextApi => ({
  locale: (value: string, bundle: string, path: string) =>
    pcore().getLocaleUtils().getLocaleValue(value, bundle, path),
  loadingContent: () =>
    pcore().getLocaleUtils().getLocaleValue('Loading content...', GENERIC_BUNDLE, GENERIC_PATH),
});

const createLinks = (): LinksApi => ({
  caseUrl: ({ caseKey, className, workId, page = 'pyDetails' }: CaseUrlOptions) => {
    const semanticUrlUtils = pcore().getSemanticUrlUtils();
    return semanticUrlUtils.getResolvedSemanticURL(
      semanticUrlUtils.getActions().ACTION_OPENWORKBYHANDLE,
      { caseClassName: className },
      { workID: workId },
      { page },
      { caseID: caseKey },
    );
  },
});

const createCaseActions = (getPConnect: GetPConnect): CaseActionsApi => ({
  open: (caseKey: string, className: string) => {
    getPConnect().getActionsApi().openWorkByHandle(caseKey, className);
  },
  preview: (caseKey: string, className: string) => {
    getPConnect().getActionsApi().showCasePreview(encodeURI(caseKey), { caseClassName: className });
  },
});

const createContextTree = (context: () => string): ContextTreeApi => {
  /* Older platform versions ship without the context tree manager. Resolving
     that once here is what spares every caller its own guard. */
  const available = typeof pcore()?.getContextTreeManager === 'function';

  return {
    available,
    registerPageList: ({ pageListName, className, pageReference, viewName }: RegisterPageListOptions) => {
      if (!available) return;
      pcore()
        .getContextTreeManager()
        .addPageListNode(context(), pageReference, pageListName, className, viewName);
    },
  };
};

/**
 * Build the platform facade for a component.
 *
 * Call it once per render from the component's `getPConnect` prop:
 * `const platform = createPlatform(getPConnect);`
 */
export const createPlatform = (getPConnect: GetPConnect): Platform => {
  /* Resolved on first use, not up front: a component that only builds a link
     or translates a string should not need a PConnect that can report a
     context. Cached so repeated calls stay cheap. */
  let resolvedContext: string | undefined;
  const context = (): string => {
    if (resolvedContext === undefined) {
      resolvedContext = getPConnect().getContextName();
    }
    return resolvedContext as string;
  };
  const caseData = createCaseData(getPConnect, context);

  return {
    get context() {
      return context();
    },
    caseData,
    caseInfo: createCaseInfo(getPConnect),
    text: createText(),
    views: createViews(getPConnect, caseData),
    events: createEvents(),
    links: createLinks(),
    caseActions: createCaseActions(getPConnect),
    contextTree: createContextTree(context),
  };
};
