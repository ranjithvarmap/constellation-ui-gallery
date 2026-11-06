import type { ReactElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import { Configuration } from '@pega/cosmos-react-core';
import * as DemoStories from './demo.stories';
import { installEditableTablePlatform } from './demo.fixtures';
import { PegaExtensionsEditableTableLayout } from './index';
import type { PlatformFake } from '../shared/platform/fake';

const { Default } = composeStories(DemoStories);

let platform: PlatformFake | undefined;
afterEach(() => platform?.restore());

/* Stories get the Cosmos theme from Storybook's decorators; direct renders need it too. */
const renderInCosmos = (ui: ReactElement) => render(<Configuration>{ui}</Configuration>);

const renderTable = async () => {
  platform = installEditableTablePlatform();
  renderInCosmos(<PegaExtensionsEditableTableLayout getPConnect={platform.getPConnect} />);
  await screen.findAllByRole('button', { name: 'Delete this record' });
  return platform;
};

test('renders editable table component with default args', async () => {
  render(<Default />);
  expect(await screen.findByText('Edit computers')).toBeVisible();
});

/* Each cell renders on its own row of the embedded `.Computers` list, inside
   a form, so an edit lands on that row. */
test('renders each cell on its own row of .Computers', async () => {
  const { calls } = await renderTable();

  expect(screen.getAllByDisplayValue('Lenovo')).toHaveLength(1);
  const cell = calls.pages.find((page) => page.pageReference === 'caseInfo.content.Computers[1]');
  expect(cell?.options).toMatchObject({ hasForm: true, referenceList: '.Computers', viewName: 'ComputersView' });
});

/* Adding a row is a list insert at the end. The platform reads the row index
   from the environment, so it must be set before the insert. */
test('adds a row at the end of .Computers', async () => {
  const { calls } = await renderTable();

  fireEvent.click(screen.getByRole('button', { name: 'Add new record' }));

  expect(calls.pageCalls).toEqual([
    { pageReference: 'caseInfo.content', api: 'listActions', method: 'insert', args: [{}, 3] },
  ]);
  const scope = calls.pages.find((page) => page.pageReference === 'caseInfo.content');
  expect(scope?.env.index).toBe(3);
  expect(scope?.options).toMatchObject({ referenceList: '.Computers', viewName: 'ComputersView' });
});

test('deletes the row whose button was pressed', async () => {
  const { calls } = await renderTable();

  fireEvent.click(screen.getAllByRole('button', { name: 'Delete this record' })[1]);

  expect(calls.pageCalls).toEqual([
    { pageReference: 'caseInfo.content', api: 'listActions', method: 'deleteEntry', args: [1] },
  ]);
  expect(screen.queryByDisplayValue('Lenovo')).not.toBeInTheDocument();
});

test('registers the list with the context tree', async () => {
  const { calls } = await renderTable();

  /* (contextName, pageName, viewName, pageListName) */
  expect(calls.registeredPageLists).toEqual([['app/primary_1', 'caseInfo.content', 'demoView', 'Computers']]);
});
