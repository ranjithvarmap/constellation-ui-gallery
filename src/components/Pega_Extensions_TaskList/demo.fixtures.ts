/**
 * The platform a Task List runs against, shared by its story and its test,
 * so the test can assert on what the story's component actually does.
 */
import { installPlatformFake, type PlatformFake } from '../shared/platform/fake';

export const CASE_KEY = 'ORG-APP-WORK T-1';

/** The tasks the data page returns for the case. */
export const tasks = () => [
  { Id: '1', Label: 'Project configuration has been completed', IsCompleted: true },
  { Id: '2', Label: 'Create the project report', IsCompleted: false },
];

/** Install the shared platform double for a task list on case `T-1`. */
export const installTaskListPlatform = (): PlatformFake =>
  installPlatformFake({ rows: tasks(), caseInfo: { key: CASE_KEY } });
