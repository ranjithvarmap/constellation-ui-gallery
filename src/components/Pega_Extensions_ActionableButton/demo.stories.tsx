import type { StoryObj } from '@storybook/react-webpack5';
import { PegaExtensionsActionableButton } from './index';
import { installActionableButtonPlatform } from './demo.fixtures';

export default {
  title: 'Fields/Actionable Button',
  argTypes: {
    getPConnect: {
      table: {
        disable: true,
      },
    },
  },
  component: PegaExtensionsActionableButton,
};

type Story = StoryObj<typeof PegaExtensionsActionableButton>;

export const Default: Story = {
  render: (args) => {
    /* The shared platform double, rather than a hand-rolled window.PCore stub. */
    const platform = installActionableButtonPlatform('workarea', {
      saveAssignment: () => Promise.resolve(),
      openLocalAction: (name: string, options: { caseID: string }) => {
        alert(`Launch local action ${name} for ${options.caseID}`);
      },
    });
    return <PegaExtensionsActionableButton {...args} getPConnect={platform.getPConnect} />;
  },
  args: {
    label: 'Launch',
    localAction: 'pyEditDetails',
    value: 'Work-Case C-123',
  },
};
