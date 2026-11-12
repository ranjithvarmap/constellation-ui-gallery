import type { StoryObj } from '@storybook/react-webpack5';
import { PegaExtensionsMap } from './index';
import { installMapPlatform } from './demo.fixtures';

export default {
  title: 'Templates/Map',
  argTypes: {
    displayMode: {
      options: ['', 'DISPLAY_ONLY'],
      control: { type: 'radio', labels: { '': 'EDITABLE' } },
    },
    getPConnect: {
      table: {
        disable: true,
      },
    },
    locationInputType: {
      table: {
        disable: true,
      },
    },
    ZoomRef: {
      table: {
        disable: true,
      },
    },
  },
  parameters: {
    layout: 'fullscreen',
  },
  component: PegaExtensionsMap,
};

type Story = StoryObj<typeof PegaExtensionsMap>;
export const Default: Story = {
  render: (args) => {
    /* The shared platform double, rather than a hand-rolled window.PCore stub. */
    const platform = installMapPlatform(args.selectionProperty);
    return <PegaExtensionsMap {...args} getPConnect={platform.getPConnect} />;
  },
  args: {
    heading: 'Map',
    height: '20rem',
    Latitude: '35',
    Longitude: '-110',
    Zoom: '4',
    displayMode: '',
    bFreeFormDrawing: false,
    bShowSearch: false,
    createTools: 'point,polyline,polygon,rectangle,circle',
    selectionProperty:
      '{"shapes":[{"type":"polygon","coordinates":[{"x":-11902954.520884523,"y":4538976.751116623},{"x":-11902954.520884523,"y":4069347.6493326253},{"x":-12372583.622668521,"y":4069347.6493326253},{"x":-12372583.622668521,"y":4538976.751116623},{"x":-11902954.520884523,"y":4538976.751116623}]}]}',
    apiKey: '',
    locationInputType: 'constant',
    ZoomRef: '',
  },
};
