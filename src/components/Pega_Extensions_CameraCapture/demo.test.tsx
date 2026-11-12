import type { ReactElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import { Configuration } from '@pega/cosmos-react-core';
import * as DemoStories from './demo.stories';
import { CASE_KEY, installCameraCapturePlatform } from './demo.fixtures';
import { PegaExtensionsCameraCapture } from './index';
import type { PlatformFake } from '../shared/platform/fake';

const { Default } = composeStories(DemoStories);

let platform: PlatformFake | undefined;

/* jsdom has no camera and reports a video as 0x0. These stand in for the
   browser so a photo can be taken; the canvas is mocked by jest-canvas-mock. */
beforeEach(() => {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: () => Promise.resolve({ getTracks: () => [] }) },
  });
  Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', { configurable: true, get: () => 640 });
  Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', { configurable: true, get: () => 480 });
  /* jsdom's play() is unimplemented and returns undefined; browsers return a promise. */
  jest.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
});
afterEach(() => platform?.restore());

/* Stories get the Cosmos theme from Storybook's decorators; direct renders need it too. */
const renderInCosmos = (ui: ReactElement) => render(<Configuration>{ui}</Configuration>);

/** Take a photo and save it as an attachment. */
const takeAndSave = async (uploadResult?: unknown) => {
  platform = installCameraCapturePlatform(uploadResult);
  renderInCosmos(<PegaExtensionsCameraCapture buttonText='Capture with Camera' getPConnect={platform.getPConnect} />);
  fireEvent.click(screen.getByRole('button', { name: 'Capture with Camera' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Capture' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Save as Attachment' }));
  return platform.calls;
};

test('renders Camera Capture widget with default args', async () => {
  render(<Default />);
  expect(await screen.findByRole('button')).toBeVisible();
});

/* The photo is uploaded, then linked to the case the widget is on: the case
   comes from caseInfo, so a wrong field would attach it to nothing. */
test('uploads the photo and links it to the case it is on', async () => {
  const calls = await takeAndSave();

  expect(await screen.findByRole('status')).toHaveTextContent('Attachment added to case successfully');
  expect(calls.uploads).toEqual([{ name: expect.stringMatching(/\.png$/), context: 'app/primary_1' }]);
  expect(calls.attachmentLinks).toEqual([
    {
      caseKey: CASE_KEY,
      /* The uploaded file, under the name it was uploaded with. */
      files: [
        expect.objectContaining({ ID: 'attachment-1', type: 'File', fileType: 'PNG', name: calls.uploads[0].name }),
      ],
      type: 'File',
      context: 'app/primary_1',
    },
  ]);
});

test('says so, and links nothing, when the upload fails', async () => {
  const calls = await takeAndSave({});

  expect(await screen.findByRole('status')).toHaveTextContent('Failed to upload attachment');
  expect(calls.attachmentLinks).toEqual([]);
});
