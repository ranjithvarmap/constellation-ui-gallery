import type { StoryObj } from '@storybook/react-webpack5';
import { PegaExtensionsCheckboxTrigger, type CheckboxTriggerProps } from './index';
import { installCheckboxTriggerPlatform } from './demo.fixtures';

export default {
  title: 'Fields/Checkbox Trigger',
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
  component: PegaExtensionsCheckboxTrigger,
};

type Story = StoryObj<typeof PegaExtensionsCheckboxTrigger>;

const CheckboxTriggerDemo = (inputs: CheckboxTriggerProps) => {
  return {
    render: (args: CheckboxTriggerProps) => {
      /* The shared platform double, rather than a hand-rolled window.PCore stub. */
      const platform = installCheckboxTriggerPlatform();
      return <PegaExtensionsCheckboxTrigger {...args} getPConnect={platform.getPConnect} />;
    },
    args: inputs,
  };
};

export const Default: Story = CheckboxTriggerDemo({
  label: 'Demo checkbox',
  dataPage: '',
  value: false,
  testId: 'demo',
  placeholder: '',
  validatemessage: '',
  helperText: '',
  disabled: false,
  readOnly: false,
  required: false,
  hideLabel: false,
});
