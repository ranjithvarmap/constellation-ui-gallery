import type { ReactElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import { Configuration } from '@pega/cosmos-react-core';
import * as DemoStories from './demo.stories';
import { CONTEXT, installHierarchicalFormPlatform } from './demo.fixtures';
import { PegaExtensionsDynamicHierarchicalForm } from './index';
import type { PlatformFake } from '../shared/platform/fake';

const { Default } = composeStories(DemoStories);

let platform: PlatformFake | undefined;
afterEach(() => platform?.restore());

/* Stories get the Cosmos theme from Storybook's decorators; direct renders need it too. */
const renderInCosmos = (ui: ReactElement) => render(<Configuration>{ui}</Configuration>);

const renderForm = async () => {
  platform = installHierarchicalFormPlatform(3);
  renderInCosmos(
    <PegaExtensionsDynamicHierarchicalForm label='Select your products' getPConnect={platform.getPConnect} />,
  );
  await screen.findAllByText('Product #3');
  return platform.calls;
};

test('renders Dynamic Hierarchical Form component with default args', async () => {
  render(<Default />);
  expect(await screen.findByText('Select your products')).toBeVisible();
  expect(await screen.findAllByText('Product #1')).toHaveLength(2);
  expect(await screen.findAllByText('Product #2')).toHaveLength(2);
  expect(await screen.findAllByText('Product #3')).toHaveLength(2);
});

/* Each product's form renders on that product's own row, so its fields read
   and write the right product. */
test("renders each product's form on its own row of .Products", async () => {
  const calls = await renderForm();

  for (const row of [0, 1, 2]) {
    const scope = calls.pages.find((page) => page.pageReference === `caseInfo.content.Products[${row}]`);
    expect(scope?.options).toEqual({
      context: CONTEXT,
      contextName: CONTEXT,
      pageReference: `caseInfo.content.Products[${row}]`,
      target: 'caseInfo',
    });
  }
  expect(screen.getByText('Rendered on caseInfo.content.Products[0]')).toBeInTheDocument();
});

/* Deselecting writes IsSelected on that product's row; a wrong index would
   deselect another product. */
test('removing a product deselects it on its own row and hides its tab', async () => {
  const calls = await renderForm();

  fireEvent.click(screen.getByRole('button', { name: 'Remove Product #2' }));

  expect(calls.pageCalls).toEqual([
    {
      pageReference: 'caseInfo.content.Products[1]',
      api: 'actions',
      method: 'updateFieldValue',
      args: ['.IsSelected', false],
    },
  ]);
  expect(screen.queryByRole('tab', { name: 'Product #2' })).not.toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Product #1' })).toBeInTheDocument();
});

/* Registered only once the list's name is read; it once ran first and
   registered an empty name. */
test('registers the product list with the context tree', async () => {
  const calls = await renderForm();

  expect(calls.registeredPageLists).toEqual([[CONTEXT, 'caseInfo.content', 'demoView', 'Products']]);
});
