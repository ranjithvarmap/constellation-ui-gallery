import React from 'react';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as DemoStories from './demo.stories';
import { brokenLabelLinks } from '../shared/label-links';

const { Default } = composeStories(DemoStories);

test('renders Rating Input component with default args', async () => {
  render(<Default />);
  expect(await screen.findByText('Rating')).toBeVisible();
});

/* A label must name what it sits over: one pointing at nothing, or at
   something that is not a form control, is read out by no screen reader. */
test.each([['Default', Default, 'Rating']] as const)(
  '%s story: the label names a control or no control at all',
  async (_, Story, label) => {
    const { container } = render(<Story />);
    await screen.findAllByText(label);
    expect(brokenLabelLinks(container)).toEqual([]);
  },
);
