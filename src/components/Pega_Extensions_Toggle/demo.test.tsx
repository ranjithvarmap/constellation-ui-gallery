import React from 'react';
import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as DemoStories from './demo.stories';
import { brokenLabelLinks } from '../shared/label-links';

const { Default, On, ReadOnly } = composeStories(DemoStories);

test('renders Toggle with field label, caption, and helper text', async () => {
  render(<Default />);
  expect(await screen.findByText('Active status')).toBeVisible();
  expect(await screen.findByText('Is active')).toBeVisible();
  expect(await screen.findByText('Turn on to mark this record as active')).toBeVisible();
});

test('renders Toggle in the on state', async () => {
  render(<On />);
  const switchInput = await screen.findByRole('switch');
  expect(switchInput).toBeChecked();
});

test('renders read-only display text', async () => {
  render(<ReadOnly />);
  expect(await screen.findByText('Yes')).toBeVisible();
  expect(screen.queryByRole('switch')).not.toBeInTheDocument();
});

/* A label must name what it sits over: one pointing at nothing, or at
   something that is not a form control, is read out by no screen reader. */
test.each([
  ['Default', Default, 'Active status'],
  ['On', On, 'Active status'],
] as const)('%s story: the label names a control or no control at all', async (_, Story, label) => {
  const { container } = render(<Story />);
  await screen.findAllByText(label);
  expect(brokenLabelLinks(container)).toEqual([]);
});

test('the switch is named by the field label', () => {
  render(<Default />);
  expect(screen.getByRole('switch', { name: /Active status/ })).toBeInTheDocument();
});
