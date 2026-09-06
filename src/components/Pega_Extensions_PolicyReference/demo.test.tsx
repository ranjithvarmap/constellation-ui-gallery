import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from './demo.stories';

const { Default } = composeStories(stories);

test('renders Policy reference with default args', async () => {
  render(<Default />);
  expect(await screen.findByText('Policy reference')).toBeVisible();
});
