import type { StoryObj } from '@storybook/react-webpack5';
import { PegaExtensionsCaseReference } from './index';
import { installPlatformFake } from '../shared/platform/fake';

export default {
  title: 'Fields/Case Reference',
  argTypes: {
    fieldMetadata: {
      table: {
        disable: true,
      },
    },
    selectionProperty: {
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
  component: PegaExtensionsCaseReference,
};

type Story = StoryObj<typeof PegaExtensionsCaseReference>;

export const Default: Story = {
  render: (args) => {
    installPlatformFake();
    const props = {
      ...args,
      getPConnect: () => {
        return {
          getStateProps: () => {
            return {
              value: 'C-123',
            };
          },
        };
      },
    };
    return <PegaExtensionsCaseReference {...props} />;
  },
  args: {
    value: 'C-123',
    selectionProperty: 'WORK-ITEM C-123',
    allowPreview: true,
    refCaseClassName: 'PegaSample-Task',
  },
};
