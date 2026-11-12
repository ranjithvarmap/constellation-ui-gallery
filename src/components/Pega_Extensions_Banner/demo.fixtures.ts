/**
 * The platform a Banner runs against, shared by its story and its test, so the
 * test can assert on what the story's component actually does.
 */
import { installPlatformFake, type PlatformFake } from '../shared/platform/fake';

export const CASE_KEY = 'ORG-APP-WORK C-7';
export const CASE_CLASS = 'ORG-App-Work-Claim';

/** The container the platform opens for a dismiss action: listed last, as the newest is. */
export const ACTION_CONTAINER = 'app/primary_2';

/**
 * A case with two messages on its data page, an edit lock that answers with a
 * fresh etag, and a summary view the banner refreshes the case from.
 */
export const installBannerPlatform = (): PlatformFake =>
  installPlatformFake({
    caseInfo: { key: CASE_KEY, className: CASE_CLASS },
    rows: [{ pyDescription: 'Supporting documents are missing' }, { pyDescription: 'The payment is overdue' }],
    etag: 'etag-after-dismiss',
    containerItems: { 'app/primary_1': {}, [ACTION_CONTAINER]: {} },
    restResponses: { loadView: { data: { data: { caseInfo: { ID: CASE_KEY, status: 'Open-Reviewed' } } } } },
  });
