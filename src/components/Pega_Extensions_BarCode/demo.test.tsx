import React from 'react';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as DemoStories from './demo.stories';
import { brokenLabelLinks } from '../shared/label-links';

const { Default } = composeStories(DemoStories);

test('renders bar code with default args', () => {
  const { container } = render(<Default />);

  const svgEl = container.querySelector('svg') as SVGSVGElement;
  expect(svgEl).not.toBeNull();
  expect(svgEl.textContent).toContain('A2345FG721');
});

/* A label must name what it sits over: one pointing at nothing, or at
   something that is not a form control, is read out by no screen reader. */
test.each([['Default', Default, 'Barcode']] as const)(
  '%s story: the label names a control or no control at all',
  async (_, Story, label) => {
    const { container } = render(<Story />);
    await screen.findAllByText(label);
    expect(brokenLabelLinks(container)).toEqual([]);
  },
);
