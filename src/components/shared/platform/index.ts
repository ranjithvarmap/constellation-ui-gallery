/**
 * Real implementation of the platform facade, backed by the `PCore` global
 * and the component's own `PConnect`.
 *
 * This is the only module in the gallery that should reference
 * `(window as any).PCore`. Everything else goes through {@link Platform}.
 */
import type {
  AttachmentsApi,
  ComponentsApi,
  ContainersApi,
  DataPageReadOptions,
  DataPagesApi,
  EnvironmentApi,
  FieldsApi,
  FormsApi,
  MessagingApi,
  RegisterViewOptions,
  RenderDetailViewOptions,
  StoreApi,
  UploadOptions,
  CaseActionsApi,
  CaseDataApi,
  CaseInfoApi,
  PlatformEvent,
  SubscribeOptions,
  TextApi,
  CaseUrlOptions,
  ContextTreeApi,
  DataObjectsApi,
  DetailViewResponse,
  EventsApi,
  GetPConnect,
  LinksApi,
  LoadDetailViewOptions,
  LoadViewOptions,
  PageScope,
  PageScopeOptions,
  PagesApi,
  Platform,
  QueryOptions,
  RegisterPageListOptions,
  RestResponse,
  SaveAssignmentOptions,
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
    /* The gallery's own event: no platform constant names it. */
    case 'widgetUpdated':
      return 'WidgetUpdated';
    /* istanbul ignore next - exhaustive over the union */
    default:
      throw new Error(`Unknown platform event: ${event}`);
  }
};

const createCaseData = (getPConnect: GetPConnect, context: () => string): CaseDataApi => ({
  query: (dataView: string, options: QueryOptions = {}) =>
    pcore().getDataApiUtils().getData(dataView, options, context()),

  /* Two arguments, never a third: see the JSDoc on CaseDataApi. */
  queryUnscoped: (dataView: string, options: QueryOptions = {}) => pcore().getDataApiUtils().getData(dataView, options),

  refreshEtag: async (caseKey: string) => {
    const lock = await pcore().getDataApiUtils().getCaseEditLock(caseKey, context());
    pcore().getContainerUtils().updateCaseContextEtag(context(), lock.headers.etag);
  },

  updateFields: async (caseKey: string, fields: Record<string, unknown>) => {
    const lock = await pcore().getDataApiUtils().getCaseEditLock(caseKey, context());
    const payload: Record<string, unknown> = { [caseKey]: { ...fields } };
    await pcore().getDataApiUtils().updateCaseEditFieldsData(caseKey, payload, lock.headers.etag, context());
  },

  fetchDetailView: (dataPage: string, viewName: string, params: Record<string, string>) =>
    pcore().getDataApiUtils().getDataObjectView(dataPage, viewName, params) as Promise<DetailViewResponse>,

  loadView: ({ caseKey, className, viewId, context: viewContext }: LoadViewOptions) => {
    const payload = { queryPayload: { caseClassName: className, caseID: caseKey, viewID: viewId } };
    /* The context argument is passed only when given, never as undefined. */
    const args: unknown[] = viewContext === undefined ? ['loadView', payload] : ['loadView', payload, viewContext];
    return pcore()
      .getRestClient()
      .invokeRestApi(...args) as Promise<RestResponse>;
  },

  saveAssignment: ({ assignmentId, actionId, etag, content }: SaveAssignmentOptions) =>
    pcore()
      .getRestClient()
      .invokeRestApi('save', {
        queryPayload: { assignmentID: assignmentId, actionID: actionId },
        body: { content },
        headers: { 'if-match': etag },
      })
      .then((response: RestResponse) => {
        /* The save moved the case on; without its etag the next write is stale. */
        pcore().getContainerUtils().updateCaseContextEtag(context(), response.headers.etag);
      }),
});

const createDataObjects = (): DataObjectsApi => ({
  create: (dataPage: string, data: Record<string, unknown>) =>
    pcore()
      .getRestClient()
      .invokeRestApi('createDataObject', { body: { data }, queryPayload: { data_view_ID: dataPage } }),
  update: (dataPage: string, data: Record<string, unknown>) =>
    pcore()
      .getRestClient()
      .invokeRestApi('updateDataObject', { queryPayload: { data_view_ID: dataPage }, body: { data } }),
});

const createViews = (getPConnect: GetPConnect, caseData: CaseDataApi): ViewsApi => {
  const metadata = (viewName: string, className: string) =>
    pcore().getViewResources().fetchViewResources(viewName, getPConnect(), className);

  const renderDetailView = ({ viewName, id, className, data, configOverrides }: RenderDetailViewOptions) => {
    /* Host the view in a transient container item so it resolves a context of
       its own — it is not backed by an assignment. */
    const containerManager = getPConnect().getContainerManager();
    const transientItemID = containerManager.addTransientItem({
      id: `${viewName}${id}`,
      data: {},
    });
    containerManager.updateTransientData({ transientItemID, data });

    const viewConfig = {
      meta: metadata(viewName, className),
      options: {
        contextName: transientItemID,
        context: transientItemID,
        pageReference: 'content',
      },
    };
    Object.assign(viewConfig.meta.config, { showLabel: false, pyID: id }, configOverrides ?? {});

    const c11nEnv = pcore().createPConnect(viewConfig);
    return c11nEnv.getPConnect().createComponent(viewConfig.meta);
  };

  const addResources = async (responseData: unknown) => {
    await pcore().getViewResources().updateViewResources(responseData);
  };

  return {
    metadata,
    renderDetailView,
    addResources,
    loadDetailView: async ({ dataPage, viewName, id, className, params, configOverrides }: LoadDetailViewOptions) => {
      const response = await caseData.fetchDetailView(dataPage, viewName, params ?? { pyID: id });
      await addResources(response.data);
      return renderDetailView({ viewName, id, className, data: response.data.data.dataInfo, configOverrides });
    },
  };
};

const createEvents = (): EventsApi => ({
  on: <TPayload>(
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

  emit: (event: PlatformEvent, payload: unknown) => {
    pcore().getPubSubUtils().publish(eventConstant(event), payload);
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

/**
 * Wraps createPConnect. `context` defaults to the component's own; the other
 * options are copied only when the caller gave them, so the platform receives
 * the same options object the call site built before the facade existed.
 */
const createPages = (context: () => string): PagesApi => ({
  at: (pageReference: string, { meta, index, context: pageContext, ...rest }: PageScopeOptions): PageScope => {
    const options: Record<string, unknown> = { context: pageContext ?? context(), pageReference };
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) options[key] = value;
    }

    const c11nEnv = pcore().createPConnect({ meta, options });
    if (index !== undefined) c11nEnv.index = index;
    const scoped = () => c11nEnv.getPConnect();

    return {
      get actions() {
        return scoped().getActionsApi();
      },
      get listActions() {
        return scoped().getListActions();
      },
      get contextName() {
        return scoped().getContextName();
      },
      render: (renderMeta: unknown) => scoped().createComponent(renderMeta),
    };
  },
});

/* The bundle and path the platform uses for its own generic UI strings. */
const GENERIC_BUNDLE = 'Generic';
const GENERIC_PATH = '@BASECLASS!GENERIC!PYGENERICFIELDS';

const createText = (): TextApi => ({
  locale: (value: string, bundle: string, path: string) => pcore().getLocaleUtils().getLocaleValue(value, bundle, path),
  loadingContent: () => pcore().getLocaleUtils().getLocaleValue('Loading content...', GENERIC_BUNDLE, GENERIC_PATH),
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

  workUrl: ({ className, workId }: { className: string; workId: string }) => {
    const semanticUrlUtils = pcore().getSemanticUrlUtils();
    return semanticUrlUtils.getResolvedSemanticURL(
      semanticUrlUtils.getActions().ACTION_OPENWORKBYHANDLE,
      { caseClassName: className },
      { workID: workId },
    );
  },

  pageUrl: (pageName: string) => {
    const semanticUrlUtils = pcore().getSemanticUrlUtils();
    return semanticUrlUtils.getResolvedSemanticURL(
      semanticUrlUtils.getActions().ACTION_SHOWVIEW,
      { page: pageName },
      '',
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
    /* The platform's order is (contextName, pageName, viewName, pageListName).
       It was once called here as (context, page, list, className, view), which
       registered nothing usable; the test pins the order to Pega's example. */
    registerPageList: ({ pageReference, viewName, pageListName, node }: RegisterPageListOptions) => {
      if (!available) return;
      const args: unknown[] = [context(), pageReference, viewName, pageListName];
      /* The node description goes only when given, as a fifth argument. */
      if (node !== undefined) args.push(node);
      pcore()
        .getContextTreeManager()
        .addPageListNode(...args);
    },
    registerView: ({ pageReference, viewName }: RegisterViewOptions) => {
      if (!available) return;
      pcore().getContextTreeManager().addViewNode(context(), pageReference, viewName);
    },
  };
};

const createDataPages = (context: () => string): DataPagesApi => ({
  get available() {
    return typeof pcore()?.getDataPageUtils === 'function';
  },
  read: (dataPage: string, parameters?: Record<string, unknown>, { fresh }: DataPageReadOptions = {}) => {
    /* The cache option goes only when asked for; every gallery caller asks. */
    const args: unknown[] = [dataPage, context(), parameters];
    if (fresh) args.push({ invalidateCache: true });
    return pcore()
      .getDataPageUtils()
      .getPageDataAsync(...args);
  },
});

const createMessaging = (context: () => string): MessagingApi => ({
  subscribe: (filter: unknown, handler: (message?: unknown) => void): Unsubscribe => {
    const subscriptionId = pcore().getMessagingServiceManager().subscribe(filter, handler, context());
    let detached = false;
    return () => {
      if (detached) return;
      detached = true;
      pcore().getMessagingServiceManager().unsubscribe(subscriptionId);
    };
  },
});

const createAttachments = (context: () => string): AttachmentsApi => ({
  forCase: (caseKey: string) => pcore().getAttachmentUtils().getCaseAttachments(caseKey, context()),
  download: (attachmentId: string, responseType?: string) =>
    pcore().getAttachmentUtils().downloadAttachment(attachmentId, context(), responseType),
  upload: (file: File, { onProgress, onError }: UploadOptions = {}) =>
    pcore().getAttachmentUtils().uploadAttachment(file, onProgress, onError, context()),
  linkToCase: async (caseKey: string, files: unknown[], type: string) => {
    await pcore().getAttachmentUtils().linkAttachmentsToCase(caseKey, files, type, context());
  },
});

const createComponents = (): ComponentsApi => ({
  whenAvailable: (componentType: string | undefined, onReady: () => void) => {
    if (componentType && !pcore().getComponentsRegistry().getLazyComponent(componentType)) {
      pcore()
        .getAssetLoader()
        .getLoader('component-loader')([componentType])
        .then(() => onReady());
      return;
    }
    onReady();
  },
});

const createStore = (context: () => string): StoreApi => ({
  get available() {
    return typeof pcore()?.getStore === 'function';
  },
  contextData: (storeContext?: string) => pcore()?.getStore?.()?.getState?.()?.data?.[storeContext ?? context()],
  setProperty: (reference: string, value: unknown, storeContext?: string) => {
    pcore()
      .getStore()
      .dispatch({ type: 'SET_PROPERTY', payload: { context: storeContext ?? context(), reference, value } });
  },
});

const createContainers = (getPConnect: GetPConnect, context: () => string): ContainersApi => ({
  items: (target: string) => pcore().getContainerUtils().getContainerItems(target),
  currentItem: () => pcore().getContainerUtils().getContainerItemData(getPConnect().getTarget(), context()),
});

/**
 * The operator's session, which needs no PConnect: exported on its own for
 * code that runs outside a component, such as LangSwitch's page reload.
 */
export const environment: EnvironmentApi = {
  locale: () => pcore()?.getEnvironmentInfo?.()?.getLocale?.(),
  useLocale: () => pcore()?.getEnvironmentInfo?.()?.getUseLocale?.(),
  timeZone: () => pcore()?.getEnvironmentInfo?.()?.getTimeZone?.(),
  operatorId: () => pcore()?.getEnvironmentInfo?.()?.getOperatorIdentifier?.(),
};

let fieldRegistrations = 0;

const createFields = (getPConnect: GetPConnect): FieldsApi => ({
  onChange: (properties: string[], handler: () => void): Unsubscribe => {
    const pConn = getPConnect();
    const registration = [pConn.getContextName(), pConn.getPageReference(), properties] as const;
    fieldRegistrations += 1;
    const id = `platform-fields-${fieldRegistrations}`;
    pcore()
      .getCascadeManager()
      .registerFields(...registration, handler, id);

    let detached = false;
    return () => {
      if (detached) return;
      detached = true;
      pcore()
        .getCascadeManager()
        .unRegisterFields(...registration, handler, id);
    };
  },
});

const createForms = (): FormsApi => ({
  isValid: (formContext: string, pageReference: string) =>
    pcore().getFormUtils().isFormValid(formContext, pageReference),
});

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
    dataObjects: createDataObjects(),
    pages: createPages(context),
    text: createText(),
    views: createViews(getPConnect, caseData),
    events: createEvents(),
    links: createLinks(),
    caseActions: createCaseActions(getPConnect),
    contextTree: createContextTree(context),
    dataPages: createDataPages(context),
    messaging: createMessaging(context),
    attachments: createAttachments(context),
    components: createComponents(),
    store: createStore(context),
    containers: createContainers(getPConnect, context),
    environment,
    fields: createFields(getPConnect),
    forms: createForms(),
  };
};
