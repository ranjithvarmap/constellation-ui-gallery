import type { StoryObj } from '@storybook/react-webpack5';
import { PegaExtensionsPolicyReference } from './index';
import { installPlatformFake } from '../shared/platform/fake';

export default {
  title: 'Fields/Policy reference',
  argTypes: { getPConnect: { table: { disable: true } } },
  component: PegaExtensionsPolicyReference,
};

type Story = StoryObj<typeof PegaExtensionsPolicyReference>;

export const Default: Story = {
  render: (args) => {
    /* One shared platform double, rather than a hand-rolled window.PCore stub. */
    const platform = installPlatformFake();
    return <PegaExtensionsPolicyReference {...args} getPConnect={platform.getPConnect} />;
  },
  args: {
    label: 'Policy reference',
    placeholder: '',
    helperText: '',
    hideLabel: false,
    disabled: false,
    readOnly: false,
    required: false,
    prefix: 'POL-',
    casing: 'upper',
    showPrefixHint: true,
  },
};
