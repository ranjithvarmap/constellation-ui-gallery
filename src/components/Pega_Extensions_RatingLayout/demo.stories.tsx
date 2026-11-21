import type { StoryObj } from '@storybook/react-webpack5';
import { PegaExtensionsRatingLayout, type RatingLayoutProps } from './index';
import { installRatingLayoutPlatform } from './demo.fixtures';

// Define extended props for the story
interface StoryRatingLayoutProps extends RatingLayoutProps {
  numCategories: number;
  numRatings: number;
}

export default {
  title: 'Templates/Rating Layout',
  argTypes: {
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
            id: 'aria-valid-attr-value',
            enabled: false,
          },
        ],
      },
    },
  },
  component: PegaExtensionsRatingLayout,
};

type Story = StoryObj<StoryRatingLayoutProps>;

export const Default: Story = {
  render: ({ numCategories, numRatings, ...args }) => {
    /* The shared platform double, rather than a hand-rolled window.PCore stub. */
    const platform = installRatingLayoutPlatform(numCategories, numRatings);
    return <PegaExtensionsRatingLayout {...args} getPConnect={platform.getPConnect} />;
  },
  args: {
    minWidth: '40ch',
    numCategories: 3,
    numRatings: 3,
    label: 'Ratings',
    showLabel: true,
  },
};
