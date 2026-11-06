import { fireEvent, render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as DemoStories from './demo.stories';
import { installRatingLayoutPlatform } from './demo.fixtures';
import { PegaExtensionsRatingLayout } from './index';
import type { PlatformFake } from '../shared/platform/fake';

const { Default } = composeStories(DemoStories);

let platform: PlatformFake | undefined;
afterEach(() => platform?.restore());

test('renders RatingLayout component with default args', async () => {
  render(<Default />);
  expect(await screen.findByText('Ratings')).toBeVisible();
});

/* Each rating is a row of the embedded `.Ratings` list. A component can only
   write to its own page, so the slider writes through a scope on that row;
   a wrong index would overwrite another rating. */
test.each([
  ['Category #1 - label #1', 0, 'ArrowRight', 4],
  ['Category #1 - label #2', 1, 'ArrowLeft', 3],
])('writes "%s" to its own row of .Ratings', async (label, row, key, expected) => {
  platform = installRatingLayoutPlatform(1, 2);
  render(<PegaExtensionsRatingLayout label='Ratings' getPConnect={platform.getPConnect} />);

  fireEvent.keyDown(await screen.findByRole('slider', { name: label }), { key });

  expect(platform.calls.pageCalls).toEqual([
    {
      pageReference: `caseInfo.content.Ratings[${row}]`,
      api: 'actions',
      method: 'updateFieldValue',
      args: ['.Value', expected],
    },
  ]);
  const scope = platform.calls.pages.find((page) => page.pageReference === `caseInfo.content.Ratings[${row}]`);
  expect(scope?.options).toMatchObject({ context: 'app/primary_1', target: 'caseInfo' });
});
