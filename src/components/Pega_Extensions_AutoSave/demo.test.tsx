import { render, waitFor } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as DemoStories from './demo.stories';
import { installAutoSavePlatform } from './demo.fixtures';
import { PegaExtensionsAutoSave } from './index';
import type { PlatformFake } from '../shared/platform/fake';

const { Default } = composeStories(DemoStories);

let platform: PlatformFake | undefined;
afterEach(() => platform?.restore());

const renderAutoSave = (propertyName = '.pyDescription') => {
  platform = installAutoSavePlatform();
  const view = render(<PegaExtensionsAutoSave propertyName={propertyName} getPConnect={platform.getPConnect} />);
  return { calls: platform.calls, ...view };
};

test('renders AutoSave with default args', () => {
  render(<Default />);
});

test('watches the configured field on its own page', () => {
  const { calls } = renderAutoSave();

  expect(calls.cascades).toHaveLength(1);
  expect(calls.cascades[0]).toMatchObject({
    context: 'app/primary_1',
    pageReference: 'caseInfo.content',
    fields: ['.pyDescription'],
    active: true,
  });
});

/* The save carries the case's current etag; the response carries a new one,
   which must be stored, or the next save or submit is rejected as stale. */
test('saves the field when it changes, then stores the etag the save returns', async () => {
  const { calls } = renderAutoSave();

  calls.cascades[0].notify();

  await waitFor(() => expect(calls.etagUpdates).toEqual([{ context: 'app/primary_1', etag: 'etag-after' }]));
  expect(calls.restCalls.map(({ endpoint, payload }) => ({ endpoint, payload }))).toEqual([
    {
      endpoint: 'save',
      payload: {
        queryPayload: { assignmentID: 'ASSIGN-WORKLIST C-1!EDIT', actionID: 'EditDetails' },
        body: { content: { pyDescription: 'Updated description' } },
        headers: { 'if-match': 'etag-before' },
      },
    },
  ]);
});

test('stops watching when it unmounts', () => {
  const { calls, unmount } = renderAutoSave();

  unmount();

  expect(calls.cascades[0].active).toBe(false);
});

test('watches nothing without a property', () => {
  const { calls } = renderAutoSave('');

  expect(calls.cascades).toEqual([]);
});
