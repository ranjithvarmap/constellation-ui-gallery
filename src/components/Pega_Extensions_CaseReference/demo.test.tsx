import React from 'react';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as DemoStories from './demo.stories';
import { brokenLabelLinks } from '../shared/label-links';

const { Default } = composeStories(DemoStories);

test('renders Case Reference component with default args', async () => {
  render(<Default />);
  const linkEl = screen.getByText('C-123');
  expect(linkEl).not.toBeNull();
});

/* The property panel's label must show on a form; a details view draws it
   itself from detailFVLItem, so there the link stands alone. */
test('shows the authored label on a form, as a span over the link', async () => {
  const { container } = render(<Default label='Related claim' />);
  expect(await screen.findByText('Related claim')).toBeVisible();
  expect(brokenLabelLinks(container)).toEqual([]);
});

test('leaves the label to the details view in DISPLAY_ONLY mode', async () => {
  render(<Default label='Related claim' displayMode='DISPLAY_ONLY' />);
  expect(screen.getByText('C-123')).not.toBeNull();
  expect(screen.queryByText('Related claim')).toBeNull();
});
