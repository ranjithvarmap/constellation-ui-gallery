/**
 * The platform a Display PDF runs against, shared by its story and its test,
 * so the test can assert on what the story's component actually does.
 */
import { installPlatformFake, type PlatformFake } from '../shared/platform/fake';

export const CASE_KEY = 'ORG-APP-WORK C-88';

/** Install the shared platform double: three PDF attachments on the case, each holding `pdf`. */
export const installDisplayPdfPlatform = (pdf = ''): PlatformFake =>
  installPlatformFake({
    caseInfo: { key: CASE_KEY },
    rows: [1, 2, 3].map((n) => ({ pxObjClass: 'Link-Attachment', pyLabel: `File #${n}`, pyContext: pdf })),
  });
