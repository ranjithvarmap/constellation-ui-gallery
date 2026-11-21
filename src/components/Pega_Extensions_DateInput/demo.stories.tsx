import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { PegaExtensionsDateInput } from './index';
import { installPlatformFake } from '../shared/platform/fake';

const localeOptions = {
  'Use environment locale': undefined,
  'Gregorian (US)': 'en-US',
  'Hijri (Saudi Arabia)': 'ar-SA-u-ca-islamic-umalqura',
  'Japanese Era': 'ja-JP-u-ca-japanese',
  'Persian (Solar Hijri)': 'fa-IR-u-ca-persian',
  'Buddhist (Thailand)': 'th-TH-u-ca-buddhist',
  'Hebrew (Israel)': 'he-IL-u-ca-hebrew',
} as const;

const meta: Meta<typeof PegaExtensionsDateInput> = {
  title: 'Fields/Date Input',
  component: PegaExtensionsDateInput,
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
  argTypes: {
    localeOverride: {
      description: 'Locale tag used by Cosmos Configuration to drive the calendar system.',
      options: Object.keys(localeOptions),
      mapping: localeOptions,
      control: {
        type: 'select',
      },
    },
    hideLabel: {
      control: {
        type: 'boolean',
      },
    },
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
    getPConnect: {
      table: {
        disable: true,
      },
    },
  },
};

export default meta;
/* The operator's locale, as the platform reports it. */
const installDateInputPlatform = (locale = 'en-US') =>
  installPlatformFake({ environment: { locale, useLocale: locale, timeZone: 'UTC' } });

type Story = StoryObj<typeof PegaExtensionsDateInput>;

const buildPConnect = () => {
  return {
    getStateProps: () => {
      return {
        value: '.DateInputSample',
      };
    },
    getActionsApi: () => {
      return {
        updateFieldValue: () => {
          /* nothing */
        },
        triggerFieldChange: () => {
          /* nothing */
        },
      };
    },
    ignoreSuggestion: () => {
      /* nothing */
    },
  };
};

export const Default: Story = {
  render: (args) => {
    installDateInputPlatform();
    return <PegaExtensionsDateInput {...args} getPConnect={buildPConnect} />;
  },
  args: {
    label: 'Date of birth',
    value: '2026-03-26',
    localeOverride: undefined,
    helperText: 'Uses the user locale unless a locale override is provided.',
    validatemessage: '',
    testId: '',
    disabled: false,
    readOnly: false,
    required: false,
    hideLabel: false,
    hasSuggestions: false,
    showWeekNumber: false,
  },
};

export const JapaneseEra: Story = {
  render: (args) => {
    installDateInputPlatform();
    return <PegaExtensionsDateInput {...args} getPConnect={buildPConnect} />;
  },
  args: {
    ...Default.args,
    label: 'Japanese era date',
    localeOverride: 'ja-JP-u-ca-japanese',
    helperText: 'For example: ja-JP-u-ca-japanese',
  },
};

export const Hijri: Story = {
  render: (args) => {
    installDateInputPlatform('ar-SA');
    return <PegaExtensionsDateInput {...args} getPConnect={buildPConnect} />;
  },
  args: {
    ...Default.args,
    label: 'Hijri date',
    localeOverride: 'ar-SA-u-ca-islamic-umalqura',
    helperText: 'For example: ar-SA-u-ca-islamic-umalqura',
  },
};

export const DisplayOnly: Story = {
  render: (args) => {
    installDateInputPlatform();
    return <PegaExtensionsDateInput {...args} getPConnect={buildPConnect} />;
  },
  args: {
    ...Default.args,
    displayMode: 'DISPLAY_ONLY',
    localeOverride: 'ja-JP-u-ca-japanese',
  },
};
