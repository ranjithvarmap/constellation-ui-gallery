import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import { Configuration } from '@pega/cosmos-react-core';
import * as DemoStories from './demo.stories';
import { CASE_KEY, installMeterPlatform, testResults } from './demo.fixtures';
import { PegaExtensionsMeter } from './index';
import type { PlatformFake } from '../shared/platform/fake';

const { Default, Grouped } = composeStories(DemoStories);

let platform: PlatformFake | undefined;
afterEach(() => platform?.restore());

/* Stories get the Cosmos theme from Storybook's decorators; direct renders need it too. */
const renderInCosmos = (ui: ReactElement) => render(<Configuration>{ui}</Configuration>);

test('renders meter component with default args', async () => {
  render(<Default />);
  expect(await screen.findByText('Tasks completed')).toBeVisible();
});

test('renders a grouped meter from its data page', async () => {
  render(<Grouped />);
  expect(await screen.findByText(/Not Executed/)).toBeVisible();
});

test("reads a grouped meter's segments for the case it is on", async () => {
  platform = installMeterPlatform(testResults);
  renderInCosmos(
    <PegaExtensionsMeter
      label='Test coverage'
      dataPage='D_TestResults'
      showMetaData
      getPConnect={platform.getPConnect}
    />,
  );

  expect(await screen.findByText(/Blocked/)).toBeVisible();
  expect(platform.calls.queries).toEqual([
    { dataView: 'D_TestResults', options: { dataViewParameters: [{ pyID: CASE_KEY }] } },
  ]);
});

test('reads no data page for a single meter', () => {
  platform = installMeterPlatform();
  renderInCosmos(<PegaExtensionsMeter label='Done' value={5} totalTasks={10} getPConnect={platform.getPConnect} />);

  expect(platform.calls.queries).toEqual([]);
});
