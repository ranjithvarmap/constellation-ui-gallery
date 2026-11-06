import type { StoryObj } from '@storybook/react-webpack5';
import { PegaExtensionsAutoSave } from './index';
import { installAutoSavePlatform } from './demo.fixtures';

export default {
  title: 'Fields/AutoSave Field',
  argTypes: {
    getPConnect: {
      table: {
        disable: true,
      },
    },
  },
  component: PegaExtensionsAutoSave,
};

type Story = StoryObj<typeof PegaExtensionsAutoSave>;

export const Default: Story = {
  render: (args) => {
    /* The shared platform double, rather than a hand-rolled window.PCore stub. */
    const platform = installAutoSavePlatform();
    return <PegaExtensionsAutoSave {...args} getPConnect={platform.getPConnect} />;
  },
  args: {
    propertyName: '.pyDescription',
  },
};
