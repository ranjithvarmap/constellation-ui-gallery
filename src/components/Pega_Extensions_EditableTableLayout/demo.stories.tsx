import type { StoryObj } from '@storybook/react-webpack5';
import { PegaExtensionsEditableTableLayout, type TableLayoutProps } from './index';
import { installEditableTablePlatform } from './demo.fixtures';

export default {
  title: 'Templates/Editable Table Layout',
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
            id: 'autocomplete-valid',
            enabled: false,
          },
        ],
      },
    },
  },
  component: PegaExtensionsEditableTableLayout,
};

type Story = StoryObj<typeof PegaExtensionsEditableTableLayout>;

export const Default: Story = {
  render: (args: TableLayoutProps) => {
    /* The shared platform double, rather than a hand-rolled window.PCore stub. */
    const platform = installEditableTablePlatform();
    return <PegaExtensionsEditableTableLayout {...args} getPConnect={platform.getPConnect} />;
  },
  args: {},
};
