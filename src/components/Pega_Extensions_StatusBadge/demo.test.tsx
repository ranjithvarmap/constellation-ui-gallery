import React from 'react';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as DemoStories from './demo.stories';
import { brokenLabelLinks } from '../shared/label-links';

const { Default } = composeStories(DemoStories);

test('renders a Status badge component with default args', async () => {
  render(<Default />);
  expect(await screen.findByText('Open')).toBeVisible();
});

/* The property panel's label must show on a form; a details view draws it
   itself from detailFVLItem, so there the badge stands alone. */
test('shows the authored label on a form, as a span over the badge', async () => {
  const { container } = render(<Default label='Claim status' />);
  expect(await screen.findByText('Claim status')).toBeVisible();
  expect(brokenLabelLinks(container)).toEqual([]);
});

test('leaves the label to the details view in DISPLAY_ONLY mode', async () => {
  render(<Default label='Claim status' displayMode='DISPLAY_ONLY' />);
  expect(await screen.findByText('Open')).toBeVisible();
  expect(screen.queryByText('Claim status')).toBeNull();
});
