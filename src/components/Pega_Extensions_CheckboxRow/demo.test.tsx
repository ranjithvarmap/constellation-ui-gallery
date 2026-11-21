import type { ReactElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import { Configuration } from '@pega/cosmos-react-core';
import * as DemoStories from './demo.stories';
import { ABOVE_LIST, CONTEXT, IN_ROW, installCheckboxRowPlatform, type Placement } from './demo.fixtures';
import { PegaExtensionsCheckboxRow } from './index';
import type { PlatformFake } from '../shared/platform/fake';

const { Default } = composeStories(DemoStories);

let platform: PlatformFake | undefined;
afterEach(() => platform?.restore());

/* Stories get the Cosmos theme from Storybook's decorators; direct renders need it too. */
const renderInCosmos = (ui: ReactElement) => render(<Configuration>{ui}</Configuration>);

/** Render the checkbox where the placement puts it, and check it. */
const check = (placement: Placement, selectAllProperty = '') => {
  platform = installCheckboxRowPlatform(placement);
  renderInCosmos(
    <PegaExtensionsCheckboxRow
      label='Select'
      value={false}
      selectAllProperty={selectAllProperty}
      getPConnect={platform.getPConnect}
    />,
  );
  fireEvent.click(screen.getByRole('checkbox', { name: 'Select' }));
  return platform.calls;
};

test('renders checkbox component with default args', async () => {
  render(<Default />);
  expect(await screen.findByText('Demo checkbox')).toBeVisible();
});

test('without select-all, sets the other boolean fields of its own row', () => {
  const calls = check(IN_ROW);

  /* Its own value, then Renew, the row's other boolean, through its own actions. */
  expect(calls.fieldValues).toEqual([
    { property: '.IsSelected', value: true },
    { property: '.Renew', value: true },
  ]);
  expect(calls.pageCalls).toEqual([]);
});

/* A component can only write to its own page, so each other row is written
   through a scope on that row: a wrong index would tick the wrong policy. */
test('selecting all by field writes that field on every row of the list', () => {
  const calls = check(ABOVE_LIST, 'Policies.IsSelected');

  expect(calls.pageCalls).toEqual(
    [0, 1, 2].map((row) => ({
      pageReference: `caseInfo.content.Policies[${row}]`,
      api: 'actions',
      method: 'updateFieldValue',
      args: ['.IsSelected', true],
    })),
  );
  for (const row of [0, 1, 2]) {
    const scope = calls.pages.find((page) => page.pageReference === `caseInfo.content.Policies[${row}]`);
    expect(scope?.options).toEqual({
      context: CONTEXT,
      pageReference: `caseInfo.content.Policies[${row}]`,
      target: 'app/primary',
    });
  }
});

test('selecting all by list writes every boolean field of every row', () => {
  const calls = check(ABOVE_LIST, 'Policies');

  expect(calls.pageCalls.map(({ pageReference, args }) => [pageReference, ...args])).toEqual([
    ['caseInfo.content.Policies[0]', '.IsSelected', true],
    ['caseInfo.content.Policies[0]', '.Renew', true],
    ['caseInfo.content.Policies[1]', '.IsSelected', true],
    ['caseInfo.content.Policies[1]', '.Renew', true],
    ['caseInfo.content.Policies[2]', '.IsSelected', true],
    ['caseInfo.content.Policies[2]', '.Renew', true],
  ]);
});
