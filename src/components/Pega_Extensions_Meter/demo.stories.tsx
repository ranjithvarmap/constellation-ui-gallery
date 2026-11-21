import type { StoryObj } from '@storybook/react-webpack5';
import { PegaExtensionsMeter, type MeterProps } from './index';
import { installMeterPlatform, storageUse, testResults } from './demo.fixtures';

export default {
  title: 'Fields/Meter',
  argTypes: {
    value: {
      control: { type: 'number', min: 0, max: 100, step: 1 },
    },
    fieldMetadata: {
      table: {
        disable: true,
      },
    },
    displayMode: {
      options: ['', 'DISPLAY_ONLY'],
      control: { type: 'radio', labels: { '': 'EDITABLE' } },
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
  component: PegaExtensionsMeter,
};

type Story = StoryObj<typeof PegaExtensionsMeter>;

const MeterDemo = (inputs: MeterProps) => {
  return {
    render: (args: MeterProps) => {
      /* The shared platform double, rather than a hand-rolled window.PCore stub. */
      const platform = installMeterPlatform(args.dataPage === 'test' ? testResults : storageUse);
      return <PegaExtensionsMeter {...args} getPConnect={platform.getPConnect} />;
    },
    args: inputs,
  };
};

export const Default: Story = MeterDemo({
  displayMode: '',
  value: 50,
  dataPage: '',
  label: 'Tasks completed',
  hideLabel: false,
  color: '#34d399',
  additionalInfo: 'Number of tasks completed out of total tasks',
  showMetaData: false,
  totalTasks: 10,
});

export const Grouped: Story = MeterDemo({
  dataPage: 'test',
  label: 'Test coverage',
  showMetaData: true,
  displayMode: '',
});

export const Grouped1: Story = MeterDemo({
  dataPage: 'storage',
  label: 'System storage',
  showMetaData: true,
  totalTasks: 100,
  displayMode: '',
});
