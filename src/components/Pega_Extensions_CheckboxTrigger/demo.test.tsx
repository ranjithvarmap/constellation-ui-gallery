import type { ReactElement } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import { Configuration } from '@pega/cosmos-react-core';
import * as DemoStories from './demo.stories';
import { CONTEXT, installCheckboxTriggerPlatform } from './demo.fixtures';
import { PegaExtensionsCheckboxTrigger } from './index';
import type { PlatformFake } from '../shared/platform/fake';

const { Default } = composeStories(DemoStories);

let platform: PlatformFake | undefined;
afterEach(() => platform?.restore());

/* Stories get the Cosmos theme from Storybook's decorators; direct renders need it too. */
const renderInCosmos = (ui: ReactElement) => render(<Configuration>{ui}</Configuration>);

test('renders checkbox component with default args', async () => {
  render(<Default />);
  expect(await screen.findByText('Demo checkbox')).toBeVisible();
});

/* Ticking the box saves the record through the savable data page, with the
   container item's key, and puts what the server returns, including values
   it computed, back into the open record. */
test('refreshes the open record through the savable data page when ticked', async () => {
  platform = installCheckboxTriggerPlatform();
  renderInCosmos(
    <PegaExtensionsCheckboxTrigger
      label='Covered'
      value={false}
      dataPage='D_PolicySavable'
      getPConnect={platform.getPConnect}
    />,
  );

  fireEvent.click(screen.getByRole('checkbox', { name: 'Covered' }));

  expect(platform.calls.fieldValues).toEqual([{ property: '.Covered', value: true }]);
  expect(platform.calls.restCalls.map(({ endpoint, payload }) => ({ endpoint, payload }))).toEqual([
    {
      endpoint: 'createDataObject',
      /* The store's content, without classID, plus the item's key. */
      payload: {
        body: { data: { Name: 'Home', Covered: false, pyGUID: 'G-1' } },
        queryPayload: { data_view_ID: 'D_PolicySavable' },
      },
    },
  ]);
  await waitFor(() =>
    expect(platform?.calls.dispatched).toEqual([
      {
        type: 'SET_PROPERTY',
        /* The response, without pzInsKey. */
        payload: {
          context: CONTEXT,
          reference: 'dataInfo.content',
          value: { Name: 'Home', Covered: true, Premium: 120 },
        },
      },
    ]),
  );
});

test('does not save again when the box goes back to its stored value', () => {
  platform = installCheckboxTriggerPlatform();
  renderInCosmos(
    <PegaExtensionsCheckboxTrigger
      label='Covered'
      value
      dataPage='D_PolicySavable'
      getPConnect={platform.getPConnect}
    />,
  );

  /* Already true: the click un-ticks it, which is a change, so tick it back. */
  fireEvent.click(screen.getByRole('checkbox', { name: 'Covered' }));
  const callsAfterUntick = platform.calls.restCalls.length;
  fireEvent.click(screen.getByRole('checkbox', { name: 'Covered' }));

  expect(callsAfterUntick).toBe(1);
  expect(platform.calls.restCalls).toHaveLength(1);
});
