// import { expect, test } from '@jest/globals';
import type { ReactElement } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Configuration } from '@pega/cosmos-react-core';
import { composeStories } from '@storybook/react';
import '@testing-library/jest-dom';

import * as DemoStories from './demo.stories';
import { ASSIGNMENT, CASE_KEY, CASE_TYPE, installStepperPlatform } from './demo.fixtures';
import ActionButtons from './ActionButtons';
import type { PlatformFake } from '../shared/platform/fake';

const { Default } = composeStories(DemoStories);

test('renders PegaExtensionsFormWithVerticalStepper', async () => {
  render(<Default />);
  expect(await screen.findByText('Form template')).toBeVisible();

  expect(await screen.findByText('Step 1')).toBeVisible();
  expect(await screen.findByText('Step 2')).toBeVisible();
  expect(await screen.findByText('Step 3')).toBeVisible();
  expect(await screen.findByText('Step 4')).toBeVisible();
});

let platform: PlatformFake | undefined;
afterEach(() => platform?.restore());

/* Stories get the Cosmos theme from Storybook's decorators; direct renders need it too. */
const renderInCosmos = (ui: ReactElement) => render(<Configuration>{ui}</Configuration>);

/** Render the assignment's buttons, recording the actions they run, in order. */
const renderButtons = () => {
  const ran: unknown[][] = [];
  const record =
    (name: string) =>
    (...args: unknown[]) => {
      ran.push([name, ...args]);
      return Promise.resolve();
    };
  platform = installStepperPlatform({
    finishAssignment: record('finishAssignment'),
    saveAssignment: record('saveAssignment'),
    cancelAssignment: record('cancelAssignment'),
    navigateToStep: record('navigateToStep'),
  });
  renderInCosmos(<ActionButtons getPConnect={platform.getPConnect} />);
  return ran;
};

test("shows the assignment's own buttons", () => {
  renderButtons();

  for (const name of ['Next', 'Previous', 'Save for later']) {
    expect(screen.getByRole('button', { name })).toBeVisible();
  }
});

test('Next submits the assignment', () => {
  const ran = renderButtons();

  fireEvent.click(screen.getByRole('button', { name: 'Next' }));

  expect(ran).toEqual([['finishAssignment', 'app/primary_1', { outcomeID: '', jsActionQueryParams: {} }]]);
});

test('Previous goes back a step', () => {
  const ran = renderButtons();

  fireEvent.click(screen.getByRole('button', { name: 'Previous' }));

  expect(ran).toEqual([['navigateToStep', 'previous', 'app/primary_1']]);
});

/* Saving for later closes the assignment and tells the case which case type,
   case and assignment were saved; the case type comes from caseInfo. */
test('Save for later saves, closes the assignment, and announces what was saved', async () => {
  const ran = renderButtons();

  fireEvent.click(screen.getByRole('button', { name: 'Save for later' }));

  await waitFor(() => expect(platform?.calls.published).toHaveLength(1));
  expect(ran).toEqual([
    ['saveAssignment', 'app/primary_1'],
    ['cancelAssignment', 'app/primary_1', true],
  ]);
  expect(platform?.calls.published).toEqual([
    { event: 'CREATE_STAGE_SAVED', payload: { caseType: CASE_TYPE, caseID: CASE_KEY, assignmentID: ASSIGNMENT } },
  ]);
});
