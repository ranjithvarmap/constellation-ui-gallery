/**
 * The platform a Camera Capture runs against, shared by its story and its
 * test, so the test can assert on what the story's component actually does.
 */
import { installPlatformFake, type PlatformFake } from '../shared/platform/fake';

export const CASE_KEY = 'ORG-APP-WORK INC-12';

/** Install the shared platform double for a case whose caseInfo names it `INC-12`. */
export const installCameraCapturePlatform = (uploadResult: unknown = { ID: 'attachment-1' }): PlatformFake =>
  installPlatformFake({ caseInfo: { raw: { ID: CASE_KEY, name: 'Incident' } }, uploadResult });
