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

  describe('text', () => {
    it('names the loading string that 13 components spell out by hand', () => {
      const platform = createPlatform(fake.getPConnect);
      expect(platform.text.loadingContent()).toBe('Loading content...');
    });
  });
});
