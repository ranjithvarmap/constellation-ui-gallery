import type { ReactElement } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import { Configuration } from '@pega/cosmos-react-core';
import * as DemoStories from './demo.stories';
import { CASE_KEY, installUtilityListPlatform } from './demo.fixtures';
import { PegaExtensionsUtilityList } from './index';
import type { PlatformFake } from '../shared/platform/fake';

const { Default } = composeStories(DemoStories);

let platform: PlatformFake | undefined;
afterEach(() => platform?.restore());

/* Stories get the Cosmos theme from Storybook's decorators; direct renders need it too. */
const renderInCosmos = (ui: ReactElement) => render(<Configuration>{ui}</Configuration>);

const renderList = async (setCaseID: boolean) => {
  platform = installUtilityListPlatform();
  renderInCosmos(
    <PegaExtensionsUtilityList
      heading='Appointments'
      iconName='clipboard'
      primaryField='pyLabel'
      secondaryFields='pyID'
      secondaryFieldTypes='string'
      dataPage='D_Appointments'
      setCaseID={setCaseID}
      getPConnect={platform.getPConnect}
    />,
  );
  await screen.findByText('Appointment for Sue Lee');
  return platform.calls;
};

test('renders Utility List component with default args', async () => {
  render(<Default />);
  expect(await screen.findByText('List of objects')).toBeVisible();
  expect(await screen.findByText('6')).toBeVisible();
  expect(await screen.findByText('Appointment for John smith')).toBeVisible();
  expect(await screen.findByText('Appointment for Sue Lee')).toBeVisible();
  const BtnEl = await screen.findByText('View all');
  expect(BtnEl).toBeVisible();
  fireEvent.click(BtnEl);
  expect(await screen.findByRole('dialog')).toBeVisible();
  const CloseEl = await screen.findByLabelText('Close modal');
  expect(CloseEl).toBeVisible();
  fireEvent.click(CloseEl);
});

test("keys the list by the case's handle when asked to", async () => {
  const calls = await renderList(true);

  expect(calls.queries).toEqual([
    { dataView: 'D_Appointments', options: { dataViewParameters: [{ CaseInstanceKey: CASE_KEY }] } },
  ]);
});

test('reads the list without the case otherwise', async () => {
  const calls = await renderList(false);

  expect(calls.queries).toEqual([{ dataView: 'D_Appointments', options: {} }]);
});

/* Other widgets on the case listen for this to show the list's size. */
test('tells the case how many items it holds', async () => {
  const calls = await renderList(false);

  await waitFor(() =>
    expect(calls.published).toContainEqual({
      event: 'WidgetUpdated',
      payload: { widget: 'PEGA_EXTENSIONS_UTILITYLIST', count: 6, caseID: CASE_KEY },
    }),
  );
});
