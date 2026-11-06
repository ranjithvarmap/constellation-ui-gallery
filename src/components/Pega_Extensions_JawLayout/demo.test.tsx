import { fireEvent, render, screen } from '@testing-library/react';
import { Configuration } from '@pega/cosmos-react-core';
import '@testing-library/jest-dom';
import { composeStories } from '@storybook/react';
import * as DemoStories from './demo.stories';
import { installJawLayoutPlatform } from './demo.fixtures';
import { PegaExtensionsJawLayout } from './index';
import type { PlatformFake } from '../shared/platform/fake';

const { Default } = composeStories(DemoStories);

let platform: PlatformFake | undefined;
afterEach(() => platform?.restore());

/* Stories get the Cosmos theme from Storybook's decorators; direct renders need it too. */
const renderInCosmos = (ui: React.ReactElement) => render(<Configuration>{ui}</Configuration>);

test('renders dental chart component with default args', async () => {
  render(<Default />);

  // Test for dental chart specific elements that should be visible
  expect(await screen.findByText('Maxillary')).toBeVisible();
  expect(await screen.findByText('Mandibular')).toBeVisible();
  expect(await screen.findByText('Missing (M)')).toBeVisible();
  expect(await screen.findByText('Extracted (E)')).toBeVisible();

  // Test for healthy status in the legend
  expect(await screen.findByText('Healthy')).toBeVisible();
});

/* Each tooth is a row of the embedded `.ToothData` list. A component can only
   write to its own page, so the status is written through a scope on that
   row; a wrong index or list would mark the wrong tooth. */
test('writes a tooth status to its own row of .ToothData', async () => {
  platform = installJawLayoutPlatform();
  renderInCosmos(<PegaExtensionsJawLayout heading='Dental Chart' getPConnect={platform.getPConnect} />);

  /* Tooth 2 is position 1 and starts healthy; a click marks it missing. */
  fireEvent.click(await screen.findByRole('button', { name: /^Tooth 2,/ }));

  expect(platform.calls.pageCalls).toEqual([
    {
      pageReference: 'caseInfo.content.ToothData[1]',
      api: 'actions',
      method: 'updateFieldValue',
      args: ['.ToothStatus', 'M'],
    },
  ]);
  const scope = platform.calls.pages.find((page) => page.pageReference === 'caseInfo.content.ToothData[1]');
  expect(scope?.options).toMatchObject({ referenceList: '.ToothData', target: 'app/primary_1' });
});

test('does not write when read-only', async () => {
  platform = installJawLayoutPlatform();
  renderInCosmos(<PegaExtensionsJawLayout heading='Dental Chart' readOnly getPConnect={platform.getPConnect} />);

  fireEvent.click(await screen.findByRole('button', { name: /^Tooth 2,/ }));

  expect(platform.calls.pageCalls).toEqual([]);
});

test('registers the tooth list with the context tree', async () => {
  platform = installJawLayoutPlatform();
  renderInCosmos(<PegaExtensionsJawLayout heading='Dental Chart' getPConnect={platform.getPConnect} />);
  await screen.findByRole('button', { name: /^Tooth 2,/ });

  /* (contextName, pageName, viewName, pageListName). The platform's own example
     writes the list with a leading dot (`.EmbeddedData`); this layout, like
     EditableTableLayout and Map, passes the bare name. */
  expect(platform.calls.registeredPageLists).toEqual([['app/primary_1', 'caseInfo.content', 'demoView', 'ToothData']]);
});
