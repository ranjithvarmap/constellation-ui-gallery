import React from 'react';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as DemoStories from './demo.stories';
import { brokenLabelLinks } from '../shared/label-links';

const { Default } = composeStories(DemoStories);

test('renders Image Magnify component with default args', async () => {
  render(<Default />);
  const images = document.querySelectorAll('img');
  expect(images).toHaveLength(2);
});

/* The property panel's label must show on a form; a details view draws it
   itself from detailFVLItem, so there the image stands alone. */
test('shows the authored label on a form, as a span over the image', async () => {
  const { container } = render(<Default label='Damage photo' />);
  expect(await screen.findByText('Damage photo')).toBeVisible();
  expect(brokenLabelLinks(container)).toEqual([]);
});

test('leaves the label to the details view in DISPLAY_ONLY mode', () => {
  render(<Default label='Damage photo' displayMode='DISPLAY_ONLY' />);
  expect(screen.queryByText('Damage photo')).toBeNull();
});

test('puts the authored test ID on the element wrapping the image', () => {
  render(<Default testId='damage-photo' />);
  expect(screen.getByTestId('damage-photo').querySelector('img')).not.toBeNull();
});
