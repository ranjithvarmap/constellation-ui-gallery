import type { StoryObj } from '@storybook/react-webpack5';
import { PegaExtensionsTaskList } from './index';
import { installTaskListPlatform } from './demo.fixtures';

export default {
  title: 'Widgets/Task List',
  argTypes: {
    dataPage: {
      table: {
        disable: true,
      },
    },
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
  component: PegaExtensionsTaskList,
};

type Story = StoryObj<typeof PegaExtensionsTaskList>;

export const Default: Story = {
  render: (args: any) => {
    /* The shared platform double, rather than a hand-rolled window.PCore stub. */
    const platform = installTaskListPlatform();
    return <PegaExtensionsTaskList {...args} getPConnect={platform.getPConnect} />;
  },
  args: {
    heading: 'Tasks',
    dataPage: 'D_TaskListList',
  },
};
