/**
 * The platform an Actionable Button runs against, shared by its story and its
 * test, so the test can assert on what the story's component actually does.
 */
import { installPlatformFake, type PlatformFake } from '../shared/platform/fake';

/** The actions the case offers its current operator. */
export const availableActions = [{ ID: 'pyEditDetails', name: 'Edit Details' }];

/**
 * Install the shared platform double for a button in the given container.
 * `actions` replaces actions-API methods, e.g. to watch openLocalAction.
 */
export const installActionableButtonPlatform = (
  containerName: 'workarea' | 'primary' = 'workarea',
  actions: Record<string, unknown> = {},
): PlatformFake =>
  installPlatformFake({
    caseInfo: { availableActions },
    pConnect: { getContainerName: () => containerName },
    actions,
  });
