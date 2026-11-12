import type { StoryObj } from '@storybook/react-webpack5';
import { PegaExtensionsDynamicHierarchicalForm, type DynamicHierarchicalFormProps } from './index';
import { installHierarchicalFormPlatform } from './demo.fixtures';

export default {
  title: 'Templates/Dynamic Hierarchical Form',
  argTypes: {
    getPConnect: {
      table: {
        disable: true,
      },
    },
  },
  parameters: {
    a11y: {
      context: '#storybook-root',
      config: {
        rules: [
          {
            id: 'nested-interactive',
            enabled: false,
          },
          {
            id: 'autocomplete-valid',
            enabled: false,
          },
        ],
      },
    },
  },
  component: PegaExtensionsDynamicHierarchicalForm,
};

interface DynamicHierarchicalFormPropsExt extends DynamicHierarchicalFormProps {
  numProducts: number;
}
type Story = StoryObj<DynamicHierarchicalFormPropsExt>;
export const Default: Story = {
  render: ({ numProducts, ...args }: any) => {
    /* The shared platform double, rather than a hand-rolled window.PCore stub. */
    const platform = installHierarchicalFormPlatform(numProducts);
    return <PegaExtensionsDynamicHierarchicalForm {...args} getPConnect={platform.getPConnect} />;
  },
  args: {
    label: 'Select your products',
    showLabel: true,
    refreshActionLabel: 'Refresh product',
    showRefreshAction: true,
    enableItemSelection: true,
    numProducts: 3,
  },
};
