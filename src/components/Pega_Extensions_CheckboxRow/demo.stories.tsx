import type { StoryObj } from '@storybook/react-webpack5';
import { PegaExtensionsCheckboxRow, type CheckboxRowProps } from './index';
import { installCheckboxRowPlatform } from './demo.fixtures';

export default {
  title: 'Fields/Checkbox Row',
  argTypes: {
    fieldMetadata: {
      table: {
        disable: true,
      },
    },
    additionalProps: {
      table: {
        disable: true,
      },
    },
    displayMode: {
      table: {
        disable: true,
      },
    },
    selectAllProperty: {
      table: {
        disable: true,
      },
    },
    variant: {
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
  component: PegaExtensionsCheckboxRow,
};

type Story = StoryObj<typeof PegaExtensionsCheckboxRow>;

const CheckboxRowDemo = (inputs: CheckboxRowProps) => {
  return {
    render: (args: CheckboxRowProps) => {
      /* The shared platform double, rather than a hand-rolled window.PCore stub. */
      const platform = installCheckboxRowPlatform();
      return <PegaExtensionsCheckboxRow {...args} getPConnect={platform.getPConnect} />;
    },
    args: inputs,
  };
};

export const Default: Story = CheckboxRowDemo({
  label: 'Demo checkbox',
  value: false,
  testId: 'demo',
  labelProperty: '',
  validatemessage: '',
  helperText: '',
  selectAllProperty: '',
  disabled: false,
  readOnly: false,
  required: false,
});
