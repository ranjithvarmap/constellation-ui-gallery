/**
 * The platform a Meter runs against, shared by its stories and its test, so
 * the test can assert on what the stories' component actually does.
 */
import { installPlatformFake, type PlatformFake } from '../shared/platform/fake';

export const CASE_KEY = 'ORG-APP-WORK T-42';

export type Segment = { label: string; color: string; value: number };

/** Test results, as the `test` data page returns them. */
export const testResults: Segment[] = [
  { label: 'Pass', color: '#34a35d', value: 16 },
  { label: 'Failed', color: '#fb243d', value: 3 },
  { label: 'Blocked', color: '#f5fa60', value: 6 },
  { label: 'Not Executed', color: '#c084fc', value: 10 },
];

/** Storage use, as the `storage` data page returns it. */
export const storageUse: Segment[] = [
  { label: 'Apps', color: '#34d399', value: 16 },
  { label: 'Messages', color: '#fbbf24', value: 8 },
  { label: 'Media', color: '#60a5fa', value: 24 },
  { label: 'System', color: '#c084fc', value: 10 },
];

/** Install the shared platform double, with the rows the meter's data page returns. */
export const installMeterPlatform = (rows: Segment[] = []): PlatformFake =>
  /* Copies, because the meter rewrites the rows it is handed. */
  installPlatformFake({ caseInfo: { key: CASE_KEY }, rows: rows.map((row) => ({ ...row })) });
