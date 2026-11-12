import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import { Configuration } from '@pega/cosmos-react-core';
import * as DemoStories from './demo.stories';
import { CASE_KEY, installDisplayPdfPlatform } from './demo.fixtures';
import { PegaExtensionsDisplayPDF } from './index';
import type { PlatformFake } from '../shared/platform/fake';

const { Default } = composeStories(DemoStories);

let platform: PlatformFake | undefined;
afterEach(() => platform?.restore());

/* Stories get the Cosmos theme from Storybook's decorators; direct renders need it too. */
const renderInCosmos = (ui: ReactElement) => render(<Configuration>{ui}</Configuration>);

test('renders DisplayAttachments component with default args', async () => {
  render(<Default />);
  expect(await screen.findByText('File #234-23')).toBeVisible();
});

/* This data page takes the case's handle as caseInstanceKey, not pyID. */
test("lists the case's PDF attachments, read keyed by the case's handle", async () => {
  platform = installDisplayPdfPlatform('JVBERi0=');
  renderInCosmos(
    <PegaExtensionsDisplayPDF label='Documents' dataPage='D_CasePDFs' value='' getPConnect={platform.getPConnect} />,
  );

  expect(await screen.findByText('File #3')).toBeVisible();
  expect(platform.calls.queries).toEqual([
    { dataView: 'D_CasePDFs', options: { dataViewParameters: [{ caseInstanceKey: CASE_KEY }] } },
  ]);
});

test('reads no data page when showing a single PDF', () => {
  platform = installDisplayPdfPlatform();
  renderInCosmos(<PegaExtensionsDisplayPDF label='One file' dataPage='' value='' getPConnect={platform.getPConnect} />);

  expect(platform.calls.queries).toEqual([]);
});
