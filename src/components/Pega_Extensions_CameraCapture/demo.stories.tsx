import type { StoryObj } from '@storybook/react-webpack5';
import { PegaExtensionsCameraCapture } from './index';
import { installCameraCapturePlatform } from './demo.fixtures';

export default {
  title: 'Widgets/Camera',
  component: PegaExtensionsCameraCapture,
  argTypes: {
    buttonText: {
      control: 'text',
    },
    getPConnect: {
      table: { disable: true },
    },
  },
};

type Story = StoryObj<typeof PegaExtensionsCameraCapture>;

export const Default: Story = {
  render: (args) => {
    /* The shared platform double, rather than a hand-rolled window.PCore stub. */
    const platform = installCameraCapturePlatform();
    return <PegaExtensionsCameraCapture {...args} getPConnect={platform.getPConnect} />;
  },
  args: {
    buttonText: 'Capture with Camera',
  },
};
