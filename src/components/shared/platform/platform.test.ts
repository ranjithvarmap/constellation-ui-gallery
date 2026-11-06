import { createPlatform } from './index';
import { installPlatformFake, type PlatformFake } from './fake';

describe('platform facade', () => {
  let fake: PlatformFake;

  beforeEach(() => {
    fake = installPlatformFake();
  });
  afterEach(() => {
    fake.restore();
  });

  describe('caseData.updateFields', () => {
    it('locks the case before patching, and patches with the etag the lock returned', async () => {
      const platform = createPlatform(fake.getPConnect);

      await platform.caseData.updateFields('CASE-1', { pyStatusWork: 'Resolved-Completed' });

      expect(fake.calls.fieldUpdates).toEqual([
        { caseKey: 'CASE-1', fields: { pyStatusWork: 'Resolved-Completed' } },
      ]);
    });

    it('does not patch when the lock cannot be taken', async () => {
      (window as any).PCore.getDataApiUtils = () => ({
        getCaseEditLock: () => Promise.reject(new Error('locked by another operator')),
      });
      const platform = createPlatform(fake.getPConnect);

      await expect(platform.caseData.updateFields('CASE-1', { x: 1 })).rejects.toThrow(
        'locked by another operator',
      );
      expect(fake.calls.fieldUpdates).toEqual([]);
    });
  });

  describe('events.on', () => {
    it('detaches the subscription it created when the returned function is called', () => {
      const platform = createPlatform(fake.getPConnect);

      const off = platform.events.on('assignmentSubmission', () => {});
      expect(fake.allUnsubscribed()).toBe(false);

      off();
      expect(fake.allUnsubscribed()).toBe(true);
    });

    it('is safe to detach more than once', () => {
      const platform = createPlatform(fake.getPConnect);
      const off = platform.events.on('assignmentSubmission', () => {});

      off();
      off();

      expect(fake.calls.subscriptions).toHaveLength(1);
      expect(fake.allUnsubscribed()).toBe(true);
    });

    it('gives each subscription its own id, so two handlers do not evict each other', () => {
      const platform = createPlatform(fake.getPConnect);

      const offA = platform.events.on('assignmentSubmission', () => {});
      platform.events.on('assignmentSubmission', () => {});
      offA();

      const [first, second] = fake.calls.subscriptions;
      expect(first.id).not.toEqual(second.id);
      expect(first.active).toBe(false);
      expect(second.active).toBe(true);
    });
  });

  describe('views.loadDetailView', () => {
    it('queries with pyID by default and renders the fetched view', async () => {
      const platform = createPlatform(fake.getPConnect);

      const element = await platform.views.loadDetailView({
        dataPage: 'D_CaseDetails',
        viewName: 'Details',
        id: 'C-123',
        className: 'Work-MyCase',
      });

      expect(fake.calls.detailViews).toEqual([
        { dataPage: 'D_CaseDetails', viewName: 'Details', params: { pyID: 'C-123' } },
      ]);
      expect(element).not.toBeNull();
    });

    it('accepts handle-keyed data pages', async () => {
      const platform = createPlatform(fake.getPConnect);

      await platform.views.loadDetailView({
        dataPage: 'D_ByHandle',
        viewName: 'Details',
        id: 'ABC-1!CASE',
        className: 'Work-MyCase',
        params: { caseInstanceKey: 'ABC-1!CASE' },
      });

      expect(fake.calls.detailViews[0].params).toEqual({ caseInstanceKey: 'ABC-1!CASE' });
    });
  });

  describe('contextTree', () => {
    it('registers a page list when the platform supports it', () => {
      const platform = createPlatform(fake.getPConnect);

      platform.contextTree.registerPageList({
        pageListName: '.Items',
        className: 'Data-Item',
        pageReference: 'caseInfo.content',
      });

      expect(platform.contextTree.available).toBe(true);
      expect(fake.calls.registeredPageLists).toHaveLength(1);
    });

    it('no-ops on platforms without a context tree manager, instead of throwing', () => {
      fake.restore();
      fake = installPlatformFake({ contextTreeAvailable: false });
      const platform = createPlatform(fake.getPConnect);

      expect(platform.contextTree.available).toBe(false);
      expect(() =>
        platform.contextTree.registerPageList({
          pageListName: '.Items',
          className: 'Data-Item',
          pageReference: 'caseInfo.content',
        }),
      ).not.toThrow();
      expect(fake.calls.registeredPageLists).toHaveLength(0);
    });
  });

  describe('context resolution', () => {
    it('does not require a context-aware PConnect until something needs the context', () => {
      /* CaseReference only builds a link; its PConnect has no getContextName. */
      const bareGetPConnect = (() => ({})) as any;
      const platform = createPlatform(bareGetPConnect);

      expect(() =>
        platform.links.caseUrl({ caseKey: 'ABC!CASE', className: 'Work-My', workId: 'C-1' }),
      ).not.toThrow();
    });

    it('resolves the context only once', () => {
      let calls = 0;
      const counting = () => ({
        getContextName: () => {
          calls += 1;
          return 'app/primary_1';
        },
      });
      const platform = createPlatform(counting as any);

      expect(platform.context).toBe('app/primary_1');
      expect(platform.context).toBe('app/primary_1');
      expect(calls).toBe(1);
    });
  });

  describe('caseInfo', () => {
    /* Every value distinct, so a member reading another member's constant
       returns the wrong value instead of passing by coincidence. */
    const claim = {
      key: 'ORG-APP-WORK C-7',
      className: 'ORG-App-Work-Claim',
      caseTypeId: 'ORG-App-Work-Claim-Type',
      assignmentId: 'ASSIGN-WORKLIST ORG-APP-WORK C-7!REVIEW',
      activeActionId: 'Approve',
      assignmentActionId: 'Review',
      availableActions: [{ ID: 'pyEditDetails', name: 'Edit details' }],
      actionButtons: { main: [{ actionID: 'next' }], secondary: [] },
      raw: { ID: 'ORG-APP-WORK C-7', status: 'Open' },
    };

    const caseInfoFor = (options: Parameters<typeof installPlatformFake>[0]) => {
      fake.restore();
      fake = installPlatformFake(options);
      return createPlatform(fake.getPConnect).caseInfo;
    };

    it('reads each fact from its own CASE_INFO constant', () => {
      const caseInfo = caseInfoFor({ caseInfo: claim });

      expect(caseInfo.key()).toBe(claim.key);
      expect(caseInfo.className()).toBe(claim.className);
      expect(caseInfo.caseTypeId()).toBe(claim.caseTypeId);
      expect(caseInfo.assignmentId()).toBe(claim.assignmentId);
      expect(caseInfo.availableActions()).toEqual(claim.availableActions);
      expect(caseInfo.actionButtons()).toEqual(claim.actionButtons);
      expect(caseInfo.raw()).toEqual(claim.raw);
    });

    it('prefers the active action, falling back to the assignment action', () => {
      expect(caseInfoFor({ caseInfo: claim }).actionId()).toBe('Approve');
      expect(caseInfoFor({ caseInfo: { ...claim, activeActionId: undefined } }).actionId()).toBe('Review');
    });

    it('reads at call time, so a save that moves the case on is seen', () => {
      const store: Record<string, unknown> = { 'caseInfo.assignmentID': 'ASSIGN-1' };
      const caseInfo = caseInfoFor({ pConnect: { getValue: (path: string) => store[path] } });

      expect(caseInfo.assignmentId()).toBe('ASSIGN-1');
      store['caseInfo.assignmentID'] = 'ASSIGN-2';
      expect(caseInfo.assignmentId()).toBe('ASSIGN-2');
    });

    it('does not throw on a page with no case, and still lists actions as an array', () => {
      const caseInfo = caseInfoFor({ pConnect: { getValue: () => undefined } });

      expect(caseInfo.key()).toBeUndefined();
      expect(caseInfo.actionId()).toBeUndefined();
      expect(caseInfo.availableActions()).toEqual([]);
    });

    it('passes an empty value through unchanged rather than normalising it', () => {
      /* Callers send these straight into data page parameters; turning '' into
         undefined would drop the parameter from the request. */
      expect(caseInfoFor({}).key()).toBe('');
    });
  });

  describe('pages.at', () => {
    const row = 'caseInfo.content.Items[2]';

    it('sends only the options named, with context defaulting to the component', () => {
      const createPConnect = jest.spyOn((window as any).PCore, 'createPConnect');
      const meta = { type: 'Region', config: {} };

      createPlatform(fake.getPConnect).pages.at(row, { meta, target: 'app/primary' });

      /* toStrictEqual: an option the caller did not name must be absent, not
         present as undefined, or the platform gets a different object. */
      expect(createPConnect).toHaveBeenCalledWith({
        meta,
        options: { context: 'app/primary_1', pageReference: row, target: 'app/primary' },
      });
      expect(fake.calls.pages[0].options).toStrictEqual({
        context: 'app/primary_1',
        pageReference: row,
        target: 'app/primary',
      });
    });

    it('passes every named option through, and a given context wins', () => {
      createPlatform(fake.getPConnect).pages.at(row, {
        meta: {},
        context: 'app/modal_2',
        contextName: 'app/modal_2',
        referenceList: '.Items',
        viewName: 'Items',
        hasForm: true,
      });

      expect(fake.calls.pages[0].options).toStrictEqual({
        context: 'app/modal_2',
        contextName: 'app/modal_2',
        pageReference: row,
        referenceList: '.Items',
        viewName: 'Items',
        hasForm: true,
      });
    });

    it('writes to the scoped page, not the component', () => {
      createPlatform(fake.getPConnect).pages.at(row, { meta: {} }).actions.updateFieldValue('.IsSelected', true);

      expect(fake.calls.pageCalls).toEqual([
        { pageReference: row, api: 'actions', method: 'updateFieldValue', args: ['.IsSelected', true] },
      ]);
      expect(fake.calls.fieldValues).toEqual([]);
    });

    it('sets the row index on the environment before a list insert reads it', () => {
      const page = createPlatform(fake.getPConnect).pages.at('caseInfo.content', {
        meta: {},
        referenceList: '.Items',
        index: 3,
      });
      page.listActions.insert({}, 3);

      expect(fake.calls.pages[0].env.index).toBe(3);
      expect(fake.calls.pages[0].options).not.toHaveProperty('index');
      expect(fake.calls.pageCalls).toEqual([
        { pageReference: 'caseInfo.content', api: 'listActions', method: 'insert', args: [{}, 3] },
      ]);
    });

    it('renders metadata on the page and reports the context it resolved to', () => {
      const page = createPlatform(fake.getPConnect).pages.at(row, { meta: {}, context: 'app/modal_2' });

      /* The fake renders a marker element named after the metadata it was given. */
      const element = page.render({ name: 'Quantity', config: {} }) as { props: { children: unknown } };

      expect(element.props.children).toBe('Quantity');
      expect(page.contextName).toBe('app/modal_2');
    });
  });

  describe('REST operations', () => {
    const reinstall = (options: Parameters<typeof installPlatformFake>[0]) => {
      fake.restore();
      fake = installPlatformFake(options);
      return createPlatform(fake.getPConnect);
    };

    it('loads a case view, passing the context argument only when given', async () => {
      const platform = createPlatform(fake.getPConnect);

      await platform.caseData.loadView({ caseKey: 'C-1', className: 'Work-Claim', viewId: 'pyCaseSummary' });
      await platform.caseData.loadView({
        caseKey: 'C-1',
        className: 'Work-Claim',
        viewId: 'Details',
        context: 'app/primary_1',
      });

      const [first, second] = fake.calls.restCalls;
      expect(first.endpoint).toBe('loadView');
      expect(first.payload).toEqual({
        queryPayload: { caseClassName: 'Work-Claim', caseID: 'C-1', viewID: 'pyCaseSummary' },
      });
      /* Not even as undefined: a third argument changes the call. */
      expect(first.args).toHaveLength(2);
      expect(second.args).toEqual(['loadView', second.payload, 'app/primary_1']);
    });

    it('saves the assignment with the current etag, then stores the etag the save returns', async () => {
      const platform = reinstall({ restResponses: { save: { headers: { etag: 'etag-after-save' } } } });

      await platform.caseData.saveAssignment({
        assignmentId: 'ASSIGN-1',
        actionId: 'Review',
        etag: 'etag-before-save',
        content: { Notes: 'draft' },
      });

      expect(fake.calls.restCalls).toEqual([
        {
          endpoint: 'save',
          payload: {
            queryPayload: { assignmentID: 'ASSIGN-1', actionID: 'Review' },
            body: { content: { Notes: 'draft' } },
            headers: { 'if-match': 'etag-before-save' },
          },
          args: expect.any(Array),
        },
      ]);
      expect(fake.calls.etagUpdates).toEqual([{ context: 'app/primary_1', etag: 'etag-after-save' }]);
    });

    it('does not store an etag when the save fails', async () => {
      const platform = createPlatform(fake.getPConnect);
      (window as any).PCore.getRestClient = () => ({
        invokeRestApi: () => Promise.reject(new Error('409 conflict')),
      });

      await expect(
        platform.caseData.saveAssignment({ assignmentId: 'A', actionId: 'B', etag: 'e', content: {} }),
      ).rejects.toThrow('409 conflict');
      expect(fake.calls.etagUpdates).toEqual([]);
    });

    it('creates and updates records through a savable data page', async () => {
      const platform = createPlatform(fake.getPConnect);

      await platform.dataObjects.create('D_Tasks', { Label: 'Call back' });
      await platform.dataObjects.update('D_Tasks', { Id: 'T-1', IsCompleted: true });

      expect(fake.calls.restCalls.map(({ endpoint, payload }) => ({ endpoint, payload }))).toEqual([
        {
          endpoint: 'createDataObject',
          payload: { body: { data: { Label: 'Call back' } }, queryPayload: { data_view_ID: 'D_Tasks' } },
        },
        {
          endpoint: 'updateDataObject',
          payload: { queryPayload: { data_view_ID: 'D_Tasks' }, body: { data: { Id: 'T-1', IsCompleted: true } } },
        },
      ]);
    });
  });

  describe('text', () => {
    it('names the loading string that 13 components spell out by hand', () => {
      const platform = createPlatform(fake.getPConnect);
      expect(platform.text.loadingContent()).toBe('Loading content...');
    });
  });
});
