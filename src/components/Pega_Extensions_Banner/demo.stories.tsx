import type { StoryObj } from '@storybook/react-webpack5';
import { PegaExtensionsBanner } from './index';
import { installBannerPlatform } from './demo.fixtures';

export default {
  title: 'Widgets/Banner',
  argTypes: {
    getPConnect: {
      table: {
        disable: true,
      },
    },
    dismissAction: { control: 'string', if: { arg: 'dismissible', eq: true } },
  },
  component: PegaExtensionsBanner,
};

type Story = StoryObj<typeof PegaExtensionsBanner>;

export const Default: Story = {
  render: (args) => {
    /* The shared platform double, rather than a hand-rolled window.PCore stub. */
    const platform = installBannerPlatform();
    return <PegaExtensionsBanner {...args} getPConnect={platform.getPConnect} />;
  },
  args: {
    variant: 'success',
    dataPage: 'D_error',
    dismissible: false,
    dismissAction: '',
  },
};
