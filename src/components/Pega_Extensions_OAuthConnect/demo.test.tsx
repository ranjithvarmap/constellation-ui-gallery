import React from 'react';
import { render, screen } from '@testing-library/react';
import { Configuration, Icon } from '@pega/cosmos-react-core';
import { composeStories } from '@storybook/react';
import * as DemoStories from './demo.stories';

const { Default } = composeStories(DemoStories);

test('renders OAuth Connect component with default args', async () => {
  render(<Default />);
  expect(await screen.findByText('Demo Application')).toBeVisible();
  const buttonElement = screen.getByRole('button', { name: 'Connect' });
  expect(buttonElement).not.toBeNull();
});

/* The panel offers a choice of icon; the heading shows the one chosen. */
test('shows the icon chosen in the property panel', async () => {
  const { container: expected } = render(
    <Configuration>
      <Icon name='chain' />
    </Configuration>,
  );
  const chainPath = expected.querySelector('svg path')?.getAttribute('d');

  const { container } = render(<Default iconName='chain' />);
  await screen.findByText('Demo Application');

  expect(chainPath).toBeTruthy();
  expect([...container.querySelectorAll('svg path')].map((path) => path.getAttribute('d'))).toContain(chainPath);
});
