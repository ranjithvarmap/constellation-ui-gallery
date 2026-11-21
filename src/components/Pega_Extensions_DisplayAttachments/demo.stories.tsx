import type { StoryObj } from '@storybook/react-webpack5';
import { PegaExtensionsDisplayAttachments, type UtilityListProps } from './index';
import { installDisplayAttachmentsPlatform } from './demo.fixtures';

export default {
  title: 'Widgets/Display Attachments',
  argTypes: {
    dataPage: {
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
          {
            id: 'nested-interactive',
            enabled: false,
          },
        ],
      },
    },
  },
  component: PegaExtensionsDisplayAttachments,
};

/* Simulate download of attachment - The files need to be in the static  storybook folder */
async function getFile(url: string) {
  const response = await fetch(url);
  const details = await response.arrayBuffer();
  return Promise.resolve({ data: details, headers: { 'content-transfer-encoding': 'binary' } });
}

/* Sample files for previews, from Storybook's static folder; anything else is a link. */
const downloadSample = (ID: string) => {
  if (ID === 'LINK-ATTACHMENT DEMOPNG') return getFile('./Overview.png');
  if (ID === 'LINK-ATTACHMENT DEMODOCX') return getFile('./SampleWord.docx');
  if (ID === 'LINK-ATTACHMENT DEMOPDF') return getFile('./SamplePDF.pdf');
  return Promise.resolve({ data: 'https://www.pega.com' });
};

type Story = StoryObj<typeof PegaExtensionsDisplayAttachments>;

const DisplayAttachmentsDemo = (inputs: UtilityListProps) => {
  return {
    render: (args: UtilityListProps) => {
      /* The shared platform double, rather than a hand-rolled window.PCore stub. */
      const platform = installDisplayAttachmentsPlatform(downloadSample);
      return <PegaExtensionsDisplayAttachments {...args} getPConnect={platform.getPConnect} />;
    },
    args: inputs,
  };
};

export const Default: Story = DisplayAttachmentsDemo({
  heading: 'Display attachments',
  categories: '',
  useLightBox: false,
  useAttachmentEndpoint: true,
  enableDownloadAll: false,
  dataPage: 'D_AttachmentListRO',
  displayFormat: 'list',
  iconName: 'clipboard',
});

export const Tiles: Story = DisplayAttachmentsDemo({
  heading: 'Display attachments',
  categories: '',
  useLightBox: true,
  useAttachmentEndpoint: true,
  enableDownloadAll: true,
  dataPage: 'D_AttachmentListRO',
  displayFormat: 'tiles',
  iconName: 'clipboard',
});
