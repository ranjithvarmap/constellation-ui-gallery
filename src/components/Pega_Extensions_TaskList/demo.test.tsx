import type { ReactElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import { Configuration } from '@pega/cosmos-react-core';
import * as DemoStories from './demo.stories';
import { CASE_KEY, installTaskListPlatform } from './demo.fixtures';
import { PegaExtensionsTaskList } from './index';
import type { PlatformFake } from '../shared/platform/fake';

const { Default } = composeStories(DemoStories);

let platform: PlatformFake | undefined;
afterEach(() => platform?.restore());

/* Stories get the Cosmos theme from Storybook's decorators; direct renders need it too. */
const renderInCosmos = (ui: ReactElement) => render(<Configuration>{ui}</Configuration>);

const renderTaskList = async () => {
  platform = installTaskListPlatform();
  renderInCosmos(
    <PegaExtensionsTaskList heading='Tasks' dataPage='D_TaskListList' getPConnect={platform.getPConnect} />,
  );
  await screen.findByText('Create the project report');
  return platform.calls;
};

test('renders a Status badge component with default args', async () => {
  render(<Default />);
  expect(await screen.findByText('Tasks')).toBeVisible();
});

test("loads the tasks of the case it is on, keyed by the case's handle", async () => {
  const calls = await renderTaskList();

  expect(calls.queries).toEqual([
    { dataView: 'D_TaskListList', options: { dataViewParameters: [{ pyID: CASE_KEY }] } },
  ]);
  expect(screen.getByText('Project configuration has been completed')).toBeVisible();
});

test('saves a task as completed when it is ticked', async () => {
  const calls = await renderTaskList();

  fireEvent.click(screen.getByRole('checkbox', { name: 'Create the project report' }));

  expect(calls.restCalls.map(({ endpoint, payload }) => ({ endpoint, payload }))).toEqual([
    {
      endpoint: 'updateDataObject',
      payload: { queryPayload: { data_view_ID: 'D_TaskListSavable' }, body: { data: { Id: '2', IsCompleted: true } } },
    },
  ]);
});
