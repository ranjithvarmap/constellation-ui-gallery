import React from 'react';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as DemoStories from './demo.stories';
import { brokenLabelLinks } from '../shared/label-links';

const { Default, Demo1, Demo4, Demo5 } = composeStories(DemoStories);

test('renders Trend display component with default args', async () => {
  render(<Default />);
  expect(await screen.findByText('Value')).toBeVisible();
});

/* A label must name what it sits over: one pointing at nothing, or at
   something that is not a form control, is read out by no screen reader. */
test.each([
  ['Default', Default, 'Value'],
  ['Demo1', Demo1, '2 weeks history'],
  ['Demo4', Demo4, 'Amount'],
  ['Demo5', Demo5, 'Balance'],
] as const)('%s story: the label names a control or no control at all', async (_, Story, label) => {
  const { container } = render(<Story />);
  await screen.findAllByText(label);
  expect(brokenLabelLinks(container)).toEqual([]);
});
