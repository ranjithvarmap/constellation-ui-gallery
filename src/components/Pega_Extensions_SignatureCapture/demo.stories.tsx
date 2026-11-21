import type { StoryObj } from '@storybook/react-webpack5';
import { PegaExtensionsSignatureCapture } from './index';

export default {
  title: 'Fields/Signature Capture',
  argTypes: {
    value: {
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
  component: PegaExtensionsSignatureCapture,
};

type Story = StoryObj<typeof PegaExtensionsSignatureCapture>;

export const Default: Story = {
  render: (args) => {
    const props = {
      ...args,
      getPConnect: () => {
        return {
          getLocalizedValue: (val: string) => {
            return val;
          },
          getStateProps: () => {
            return {
              value: 'C-123',
            };
          },
          getActionsApi: () => {
            return {
              openWorkByHandle: () => {
                /* nothing */
              },
              createWork: () => {
                /* nothing */
              },
              updateFieldValue: () => {
                /* nothing */
              },
              triggerFieldChange: () => {
                /* nothing */
              },
              showCasePreview: () => {
                /* nothing */
              },
            };
          },
          ignoreSuggestion: () => {
            /* nothing */
          },
          acceptSuggestion: () => {
            /* nothing */
          },
          setInheritedProps: () => {
            /* nothing */
          },
          resolveConfigProps: () => {
            /* nothing */
          },
        };
      },
    };
    return <PegaExtensionsSignatureCapture {...props} />;
  },
  args: {
    label: 'Signature',
    value: '',
    helperText: 'Sign the document',
    testId: '',
    validatemessage: '',
    disabled: false,
    readOnly: false,
    required: false,
    hideLabel: false,
  },
};
