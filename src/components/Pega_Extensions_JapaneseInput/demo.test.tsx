import React from 'react';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as DemoStories from './demo.stories';

const { Default } = composeStories(DemoStories);

test('renders Japanese Input component with default args', async () => {
  render(<Default />);
  expect(await screen.findByText('TextInput Sample')).toBeVisible();
});

/* The panel's Input settings offer helper text; the field shows it. */
test('shows the helper text set in the property panel', async () => {
  render(<Default helperText='Write the name in katakana' />);
  expect(await screen.findByText('Write the name in katakana')).toBeVisible();
});
