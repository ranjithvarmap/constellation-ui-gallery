import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from './demo.stories';

const { Default } = composeStories(stories);

test('renders Coverage level with default args', async () => {
  render(<Default />);
  expect(await screen.findByText('Coverage level')).toBeVisible();
});

test('renders the options supplied by the property value list', async () => {
  render(<Default />);
  expect(await screen.findByRole('option', { name: 'Premium' })).toBeInTheDocument();
  expect(screen.getAllByRole('option')).toHaveLength(4);
});
