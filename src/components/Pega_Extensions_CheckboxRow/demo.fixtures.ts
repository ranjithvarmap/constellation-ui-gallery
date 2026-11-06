/**
 * The platform a Checkbox Row runs against, shared by its story and its test,
 * so the test can assert on what the story's component actually does.
 */
import { installPlatformFake, type PlatformFake } from '../shared/platform/fake';

export const CONTEXT = 'app/primary_1';

/** Three rows of the embedded `.Policies` list, as the store holds them. */
export const policies = () => [
  { Name: 'Home', IsSelected: false, Renew: true },
  { Name: 'Car', IsSelected: false, Renew: false },
  { Name: 'Travel', IsSelected: true, Renew: false },
];

/** Where the checkbox lives, and the property it is bound to. */
export type Placement = { pageReference: string; property: string };

/** A checkbox inside a row: it ticks the other booleans of that row. */
export const IN_ROW: Placement = { pageReference: 'caseInfo.content.Policies[0]', property: '.IsSelected' };

/** A "select all" checkbox on the case page, above the list it drives. */
export const ABOVE_LIST: Placement = { pageReference: 'caseInfo.content', property: '.SelectAllPolicies' };

/** Install the shared platform double, with `.Policies` in the store under the checkbox's context. */
export const installCheckboxRowPlatform = (placement: Placement = IN_ROW): PlatformFake =>
  installPlatformFake({
    contextName: CONTEXT,
    store: { [CONTEXT]: { caseInfo: { content: { SelectAllPolicies: false, Policies: policies() } } } },
    pConnect: {
      options: { pageReference: placement.pageReference },
      getStateProps: () => ({ value: placement.property }),
      getTarget: () => 'app/primary',
    },
  });
