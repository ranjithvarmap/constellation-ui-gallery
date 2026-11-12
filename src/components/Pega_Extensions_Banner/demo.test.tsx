import type { ReactElement } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import { Configuration } from '@pega/cosmos-react-core';
import * as DemoStories from './demo.stories';
import { ACTION_CONTAINER, CASE_CLASS, CASE_KEY, installBannerPlatform } from './demo.fixtures';
import { PegaExtensionsBanner } from './index';
import type { PlatformFake } from '../shared/platform/fake';

const { Default } = composeStories(DemoStories);

let platform: PlatformFake | undefined;
afterEach(() => platform?.restore());

/* Stories get the Cosmos theme from Storybook's decorators; direct renders need it too. */
const renderInCosmos = (ui: ReactElement) => render(<Configuration>{ui}</Configuration>);

const renderBanner = async (dismissAction = '') => {
  platform = installBannerPlatform();
  const view = renderInCosmos(
    <PegaExtensionsBanner
      variant='warning'
      dataPage='D_CaseMessages'
      dismissible
      dismissAction={dismissAction}
      getPConnect={platform.getPConnect}
    />,
  );
  await screen.findByText('The payment is overdue');
  return { calls: platform.calls, ...view };
};

/** The summary view the banner refreshes the case from, after a dismiss. */
const summaryLoad = {
  endpoint: 'loadView',
  payload: { queryPayload: { caseClassName: CASE_CLASS, caseID: CASE_KEY, viewID: 'pyCaseSummary' } },
};

test('renders Banner component with default args', async () => {
  render(<Default />);
  expect(await screen.findByText('Success')).toBeVisible();
  expect(await screen.findByText('Supporting documents are missing')).toBeVisible();
});

test("shows the case's messages, read keyed by the case's handle", async () => {
  const { calls } = await renderBanner();

  expect(calls.queries).toEqual([
    { dataView: 'D_CaseMessages', options: { dataViewParameters: [{ pyID: CASE_KEY }] } },
  ]);
  expect(screen.getByText('Supporting documents are missing')).toBeVisible();
});

test('reloads when the server pushes a message about this case, and stops listening when it unmounts', async () => {
  const { calls, unmount } = await renderBanner();

  expect(calls.messaging).toHaveLength(1);
  expect(calls.messaging[0]).toMatchObject({
    filter: { matcher: 'TASKLIST', criteria: { ID: CASE_KEY } },
    context: 'app/primary_1',
  });

  act(() => calls.messaging[0].notify());
  await waitFor(() => expect(calls.queries).toHaveLength(2));

  unmount();
  expect(calls.messaging[0].active).toBe(false);
});

test('dismissing without an action marks the messages dismissed, then refreshes the case', async () => {
  const { calls } = await renderBanner();

  fireEvent.click(screen.getByRole('button', { name: 'Dismiss banner' }));

  await waitFor(() => expect(calls.stateUpdates).toHaveLength(1));
  expect(calls.queries[1]).toEqual({
    dataView: 'D_CaseMessages',
    options: { dataViewParameters: [{ pyID: CASE_KEY, dismissed: true }] },
  });
  expect(calls.restCalls.map(({ endpoint, payload }) => ({ endpoint, payload }))).toEqual([summaryLoad]);
  expect(calls.stateUpdates).toEqual([{ caseInfo: { ID: CASE_KEY, status: 'Open-Reviewed' } }]);
  expect(calls.pageCalls).toEqual([]);
});

/* The longest path: open the action in a container of its own, submit it from
   that container's context (the component's own context would submit the
   wrong assignment), close the container, keep the case's etag current, and
   refresh. */
test('dismissing with an action submits it in its own container, then tidies up and refreshes', async () => {
  const { calls } = await renderBanner('pyCloseMessages');

  fireEvent.click(screen.getByRole('button', { name: 'Dismiss banner' }));

  expect(calls.containerChanges[0]).toEqual({
    change: 'add',
    item: {
      semanticURL: '',
      key: CASE_KEY,
      data: { caseInfo: { activeActionID: 'pyCloseMessages', isModalAction: false, viewType: 'form' } },
    },
  });
  const scope = calls.pages.find((page) => page.options.context === ACTION_CONTAINER);
  expect(scope?.options).toEqual({
    context: ACTION_CONTAINER,
    contextName: ACTION_CONTAINER,
    pageReference: 'caseInfo.content',
  });
  expect(calls.pageCalls).toEqual([
    {
      pageReference: 'caseInfo.content',
      api: 'actions',
      method: 'finishAssignment',
      args: [ACTION_CONTAINER, { outcomeID: '', jsActionQueryParams: {} }],
    },
  ]);

  await waitFor(() => expect(calls.stateUpdates).toHaveLength(1));
  expect(calls.containerChanges[1]).toEqual({
    change: 'remove',
    item: { target: 'app/primary', containerItemID: ACTION_CONTAINER },
  });
  expect(calls.etagUpdates).toEqual([{ context: 'app/primary_1', etag: 'etag-after-dismiss' }]);
  expect(calls.restCalls.map(({ endpoint, payload }) => ({ endpoint, payload }))).toEqual([summaryLoad]);
});
