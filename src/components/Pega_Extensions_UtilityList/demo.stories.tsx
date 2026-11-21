import type { StoryObj } from '@storybook/react-webpack5';
import { PegaExtensionsUtilityList } from './index';
import { installUtilityListPlatform } from './demo.fixtures';

export default {
  title: 'Widgets/Utility List',
  argTypes: {
    dataPage: {
      table: {
        disable: true,
      },
    },
    setCaseID: {
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
            id: 'list',
            enabled: false,
          },
        ],
      },
    },
  },
  component: PegaExtensionsUtilityList,
};

type Story = StoryObj<typeof PegaExtensionsUtilityList>;
export const Default: Story = {
  render: (args) => {
    /* The shared platform double, rather than a hand-rolled window.PCore stub. */
    const platform = installUtilityListPlatform();
    return <PegaExtensionsUtilityList {...args} getPConnect={platform.getPConnect} />;
  },
  args: {
    heading: 'List of objects',
    iconName: 'clipboard',
    primaryField: 'pyLabel',
    secondaryFields: 'pyID,pxCreateDateTime,pxCreateOpName',
    secondaryFieldTypes: 'string,date,string',
    dataPage: 'D_myCases',
    setCaseID: false,
  },
};
