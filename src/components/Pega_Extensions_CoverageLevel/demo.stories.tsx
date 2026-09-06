import type { StoryObj } from '@storybook/react-webpack5';
import { PegaExtensionsCoverageLevel } from './index';
import { installPlatformFake } from '../shared/platform/fake';

export default {
  title: 'Fields/Coverage level',
  argTypes: { getPConnect: { table: { disable: true } } },
  component: PegaExtensionsCoverageLevel,
};

type Story = StoryObj<typeof PegaExtensionsCoverageLevel>;

export const Default: Story = {
  render: (args) => {
    /* One shared platform double, rather than a hand-rolled window.PCore stub. */
    const platform = installPlatformFake();
    return <PegaExtensionsCoverageLevel {...args} getPConnect={platform.getPConnect} />;
  },
  args: {
    datasource: [
      { key: 'basic', value: 'Basic' },
      { key: 'standard', value: 'Standard' },
      { key: 'premium', value: 'Premium' },
      { key: 'platinum', value: 'Platinum' },
    ],
    label: 'Coverage level',
    placeholder: '',
    helperText: '',
    hideLabel: false,
    disabled: false,
    readOnly: false,
    required: false,
  },
};
