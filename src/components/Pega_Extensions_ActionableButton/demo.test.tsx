import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as DemoStories from './demo.stories';
import { installActionableButtonPlatform } from './demo.fixtures';
import { PegaExtensionsActionableButton } from './index';
import type { PlatformFake } from '../shared/platform/fake';

const { Default } = composeStories(DemoStories);

let platform: PlatformFake | undefined;
afterEach(() => platform?.restore());

/** Render the button in a container, recording the actions it runs, in order. */
const press = async (localAction: string, containerName: 'workarea' | 'primary' = 'workarea') => {
  const ran: unknown[][] = [];
  platform = installActionableButtonPlatform(containerName, {
    saveAssignment: (context: string) => {
      ran.push(['saveAssignment', context]);
      return Promise.resolve();
    },
    openLocalAction: (action: string, options: unknown) => {
      ran.push(['openLocalAction', action, options]);
    },
  });
  render(
    <PegaExtensionsActionableButton
      label='Launch'
      localAction={localAction}
      value='ORG-APP-WORK C-1'
      getPConnect={platform.getPConnect}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Launch' }));
  await waitFor(() => expect(ran.some(([name]) => name === 'openLocalAction')).toBe(true));
  return ran;
};

test('renders Actionable button with default args', () => {
  jest.spyOn(window, 'alert').mockImplementation(() => {});
  render(<Default />);
  expect(screen.getByText('Launch')).not.toBeNull();
});

/* The case's available actions name the modal; in the work area the
   assignment is saved first, so nothing typed so far is lost. */
test('saves the assignment, then opens the action named as the case names it', async () => {
  const ran = await press('pyEditDetails');

  expect(ran).toEqual([
    ['saveAssignment', 'app/primary_1'],
    [
      'openLocalAction',
      'pyEditDetails',
      { caseID: 'ORG-APP-WORK C-1', containerName: 'modal', type: 'express', name: 'Edit Details' },
    ],
  ]);
});

test('names the modal after the button when the case does not offer the action', async () => {
  const ran = await press('pyUnknownAction');

  expect(ran[1]).toEqual(['openLocalAction', 'pyUnknownAction', expect.objectContaining({ name: 'Launch' })]);
});

test('does not save first outside the work area', async () => {
  const ran = await press('pyEditDetails', 'primary');

  expect(ran.map(([name]) => name)).toEqual(['openLocalAction']);
});
