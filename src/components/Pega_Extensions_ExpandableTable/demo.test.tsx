import type { ReactElement } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Configuration } from '@pega/cosmos-react-core';
import { composeStories } from '@storybook/react';
import * as DemoStories from './demo.stories';
import { CASE_KEY, ROW_CLASS, installExpandableTablePlatform } from './demo.fixtures';
import { PegaExtensionsExpandableTable } from './index';
import type { PlatformFake } from '../shared/platform/fake';

const { Default, NestedTable } = composeStories(DemoStories);

test('renders expandable table component with default args', async () => {
  render(<Default />);
  expect(await screen.findByText('Computer inventory')).toBeVisible();
});

test('renders expand buttons for each row', async () => {
  render(<Default />);
  await screen.findByText('Computer inventory');
  const buttons = await screen.findAllByRole('button', { name: 'Expand row' });
  expect(buttons).toHaveLength(3);
});

test('expands a row to show detail view on button click', async () => {
  render(<Default />);
  await screen.findByText('Computer inventory');
  const expandButtons = await screen.findAllByRole('button', { name: 'Expand row' });
  fireEvent.click(expandButtons[0]);
  expect(await screen.findByText(/Serial number/i)).toBeVisible();
  expect(screen.getByRole('button', { name: 'Collapse row' })).toBeVisible();
});

test('collapses an expanded row on second button click', async () => {
  render(<Default />);
  await screen.findByText('Computer inventory');
  const expandButtons = await screen.findAllByRole('button', { name: 'Expand row' });
  fireEvent.click(expandButtons[0]);
  await screen.findByText(/Serial number/i);
  const collapseButton = screen.getByRole('button', { name: 'Collapse row' });
  fireEvent.click(collapseButton);
  expect(screen.queryByText(/Serial number/i)).not.toBeInTheDocument();
});

test('renders nested expandable table inside parent detail view', async () => {
  render(<NestedTable />);
  await screen.findByText('Order list');
  const expandButtons = await screen.findAllByRole('button', { name: 'Expand row' });
  fireEvent.click(expandButtons[0]);
  expect(await screen.findByText('Line items')).toBeVisible();
  expect(await screen.findByText('Widget B')).toBeVisible();
});

let platform: PlatformFake | undefined;
afterEach(() => platform?.restore());

/* Stories get the Cosmos theme from Storybook's decorators; direct renders need it too. */
const renderInCosmos = (ui: ReactElement) => render(<Configuration>{ui}</Configuration>);

/* Loaded detail views are cached for the whole module, keyed by view and
   class, so each test names its own view to see the load happen. */
const renderTable = async (detailViewName: string) => {
  platform = installExpandableTablePlatform();
  renderInCosmos(<PegaExtensionsExpandableTable detailViewName={detailViewName} getPConnect={platform.getPConnect} />);
  await screen.findAllByRole('button', { name: 'Expand row' });
  return platform.calls;
};

test('renders each cell on its own row of .Computers', async () => {
  const calls = await renderTable('CellsView');

  expect(screen.getByText('Lenovo ThinkPad')).toBeVisible();
  const cell = calls.pages.find((page) => page.pageReference === 'caseInfo.content.Computers[1]');
  expect(cell?.options).toMatchObject({ referenceList: '.Computers', viewName: 'ComputersTable' });
});

/* Expanding loads the row class's detail view once, keyed by the case, then
   renders it on that row, in the table's context. */
test('expanding a row loads its detail view, then renders it on that row', async () => {
  const calls = await renderTable('ExpandView');

  fireEvent.click(screen.getAllByRole('button', { name: 'Expand row' })[2]);
  expect(await screen.findByText(/Apple MacBook/, { selector: 'div *' })).toBeVisible();

  expect(calls.restCalls).toEqual([
    {
      endpoint: 'loadView',
      payload: { queryPayload: { caseClassName: ROW_CLASS, caseID: CASE_KEY, viewID: 'ExpandView' } },
      args: ['loadView', expect.any(Object), 'app/primary_1'],
    },
  ]);
  const detail = calls.pages.find(
    (page) => page.pageReference === 'caseInfo.content.Computers[2]' && page.options.contextName,
  );
  expect(detail?.options).toEqual({
    context: 'app/primary_1',
    contextName: 'app/primary_1',
    pageReference: 'caseInfo.content.Computers[2]',
    referenceList: '.Computers',
    target: 'workarea',
  });
});

test('loads a detail view only once, however many rows are expanded', async () => {
  const calls = await renderTable('OnceView');

  const [first, second] = screen.getAllByRole('button', { name: 'Expand row' });
  fireEvent.click(first);
  await screen.findByText('S-1001', { exact: false });
  fireEvent.click(second);
  await screen.findByText('S-2042', { exact: false });

  expect(calls.restCalls).toHaveLength(1);
});
