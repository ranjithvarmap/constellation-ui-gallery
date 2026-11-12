import type { ReactElement } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Configuration } from '@pega/cosmos-react-core';
import { composeStories } from '@storybook/react';
import * as DemoStories from './demo.stories';
import { CASE_KEY, installDisplayAttachmentsPlatform } from './demo.fixtures';
import { PegaExtensionsDisplayAttachments } from './index';
import type { PlatformFake } from '../shared/platform/fake';

const { Default, Tiles } = composeStories(DemoStories);

test('renders DisplayAttachments component with default args', async () => {
  render(<Default />);
  expect(await screen.findByText('Display attachments')).toBeVisible();
  expect(await screen.findByText('6')).toBeVisible();
  expect(await screen.findByText('pega.com')).toBeVisible();
  const BtnEl = await screen.findByText('View all');
  expect(BtnEl).toBeVisible();
  fireEvent.click(BtnEl);
  expect(await screen.findByRole('dialog')).toBeVisible();
  const CloseEl = await screen.findByLabelText('Close modal');
  expect(CloseEl).toBeVisible();
  fireEvent.click(CloseEl);
});

test('renders DisplayAttachments component with tiles args', async () => {
  render(<Tiles />);
  expect(await screen.findByText('Display attachments')).toBeVisible();
  // Use more specific queries to avoid CSS selector issues
  expect(await screen.findByText('pega.com')).toBeInTheDocument();
  expect(await screen.findByText('DemoFile')).toBeInTheDocument();
  expect(await screen.findByText('SampleWord')).toBeInTheDocument();
  expect(await screen.findByText('demoPDF')).toBeInTheDocument();
  const BtnEl = await screen.findByLabelText('Download all');
  expect(BtnEl).toBeVisible();
  fireEvent.click(BtnEl);
});

let platform: PlatformFake | undefined;
afterEach(() => platform?.restore());

/* Stories get the Cosmos theme from Storybook's decorators; direct renders need it too. */
const renderInCosmos = (ui: ReactElement) => render(<Configuration>{ui}</Configuration>);

const renderAttachments = async (useAttachmentEndpoint: boolean) => {
  platform = installDisplayAttachmentsPlatform();
  const view = renderInCosmos(
    <PegaExtensionsDisplayAttachments
      heading='Attachments'
      categories=''
      useLightBox={false}
      useAttachmentEndpoint={useAttachmentEndpoint}
      enableDownloadAll={false}
      dataPage='D_Attachments'
      displayFormat='list'
      iconName='clipboard'
      getPConnect={platform.getPConnect}
    />,
  );
  /* The list shows the first few; both sources list pega.com first. */
  await screen.findByText('pega.com');
  return { calls: platform.calls, ...view };
};

test("reads the case's attachments from the attachment endpoint, for the case it is on", async () => {
  const { calls } = await renderAttachments(true);

  expect(calls.attachmentReads).toEqual([{ caseKey: CASE_KEY, context: 'app/primary_1' }]);
  expect(calls.queries).toEqual([]);
});

/* This data page takes the case's handle as LinkRefFrom. */
test("reads them from a data page instead when asked, keyed by the case's handle", async () => {
  const { calls } = await renderAttachments(false);

  expect(calls.queries).toEqual([
    { dataView: 'D_Attachments', options: { dataViewParameters: [{ LinkRefFrom: CASE_KEY }] } },
  ]);
  expect(calls.attachmentReads).toEqual([]);
});

test('reloads when an attachment is added to this case, and stops listening when it unmounts', async () => {
  const { calls, unmount } = await renderAttachments(true);

  expect(calls.messaging).toHaveLength(1);
  expect(calls.messaging[0]).toMatchObject({ filter: { matcher: 'ATTACHMENTS', criteria: { ID: CASE_KEY } } });

  act(() => calls.messaging[0].notify());
  await waitFor(() => expect(calls.attachmentReads).toHaveLength(2));

  unmount();
  expect(calls.messaging[0].active).toBe(false);
});

/* Other widgets on the case listen for this to show the attachment count. */
test('tells the case how many attachments it holds', async () => {
  const { calls } = await renderAttachments(true);

  await waitFor(() =>
    expect(calls.published).toContainEqual({
      event: 'WidgetUpdated',
      payload: expect.objectContaining({ count: 6, caseID: CASE_KEY }),
    }),
  );
});
