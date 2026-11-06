import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { PegaExtensionsJawLayout } from './index';
import { installJawLayoutPlatform } from './demo.fixtures';

const meta: Meta<typeof PegaExtensionsJawLayout> = {
  title: 'Templates/Jaw Layout',
  component: PegaExtensionsJawLayout,
  argTypes: {
    getPConnect: {
      table: {
        disable: true,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PegaExtensionsJawLayout>;

export const Default: Story = {
  render: (args) => {
    /* The shared platform double, rather than a hand-rolled window.PCore stub. */
    const platform = installJawLayoutPlatform();
    return <PegaExtensionsJawLayout {...args} getPConnect={platform.getPConnect} />;
  },
  args: {
    heading: 'Dental Chart',
    readOnly: false,
  },
};
