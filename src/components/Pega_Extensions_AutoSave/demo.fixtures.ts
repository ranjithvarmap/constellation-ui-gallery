/**
 * The platform an AutoSave field runs against, shared by its story and its
 * test, so the test can assert on what the story's component actually does.
 */
import { installPlatformFake, type PlatformFake } from '../shared/platform/fake';

/**
 * An open assignment whose `.pyDescription` was just edited: the case's
 * current etag, the edited value, and a save that answers with a new etag.
 */
export const installAutoSavePlatform = (): PlatformFake =>
  installPlatformFake({
    caseInfo: { assignmentId: 'ASSIGN-WORKLIST C-1!EDIT', activeActionId: 'EditDetails' },
    values: { 'caseInfo.headers.etag': 'etag-before', '.pyDescription': 'Updated description' },
    restResponses: { save: { headers: { etag: 'etag-after' } } },
  });
