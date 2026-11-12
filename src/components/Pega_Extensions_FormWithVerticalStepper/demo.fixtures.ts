/**
 * The platform a Form With Vertical Stepper's action buttons run against,
 * used by its tests (the story simulates its own PConnect).
 */
import { installPlatformFake, type PlatformFake } from '../shared/platform/fake';

export const CASE_KEY = 'ORG-APP-WORK CLAIM-9';
export const CASE_TYPE = 'ORG-App-Work-Claim';
export const ASSIGNMENT = 'ASSIGN-WORKLIST ORG-APP-WORK CLAIM-9!STEP2';

/** The assignment's buttons, as caseInfo holds them. */
export const actionButtons = {
  main: [{ actionID: 'next', jsAction: 'finishAssignment', name: 'Next' }],
  secondary: [
    { actionID: 'back', jsAction: 'navigateToStep', name: 'Previous' },
    { actionID: 'save', jsAction: 'saveAssignment', name: 'Save for later' },
  ],
};

/**
 * Install the shared platform double for an assignment on case CLAIM-9.
 * `actions` replaces actions-API methods, e.g. to watch what a button runs.
 * The CaseInfo's `c11nEnv` is the component's own PConnect, as on the platform.
 */
export const installStepperPlatform = (actions: Record<string, unknown> = {}): PlatformFake => {
  const platform = installPlatformFake({ caseInfo: { actionButtons, caseTypeId: CASE_TYPE }, actions });
  const pConnect = platform.getPConnect();
  pConnect.getCaseInfo = () => ({ getKey: () => CASE_KEY, getAssignmentID: () => ASSIGNMENT, c11nEnv: pConnect });
  return platform;
};
