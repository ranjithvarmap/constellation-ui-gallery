/**
 * The platform a Display Attachments widget runs against, shared by its
 * stories and its test, so the test can assert on what the component does.
 */
import { installPlatformFake, type PlatformFake } from '../shared/platform/fake';

export const CASE_KEY = 'OK5NFJ-COMPUTER-WORK F-11012';

/** Attachment rows, as an attachment data page returns them. */
export const attachmentRows = () => [
  {
    pxObjClass: 'Link-Attachment',
    pxCreateOpName: 'John Smith',
    pxCreateDateTime: '2024-01-28T14:54:50.323Z',
    pyMemo: 'pega.com',
    pzInsKey: 'LINK-ATTACHMENT DEMOURL',
    pyTopic: 'application/octet-stream',
    pyCategory: 'URL',
    pyLabel: 'URL',
  },
  {
    pxObjClass: 'Link-Attachment',
    pxCreateOpName: 'Marc Doe',
    pyFileName: 'demoPDF.pdf',
    pyTopic: 'application/pdf',
    pyFileCategory: 'FILE',
    pyLabel: 'File',
    pxCreateDateTime: '2024-01-28T13:18:43.193Z',
    pyMemo: 'demoPDF',
    pzInsKey: 'LINK-ATTACHMENT DEMOPDF',
    pyCategory: 'File',
  },
  {
    pxObjClass: 'Link-Attachment',
    pyCategory: 'Correspondence',
    pyMemo: 'Hello',
    pyTopic: 'application/octet-stream',
    pxCreateDateTime: '2024-01-28T14:54:50.323Z',
    pxCreateOpName: 'John Smith',
    pzInsKey: 'LINK-ATTACHMENT OK5NF|-COMPUTER-WORK F-11015!20240206T121808.330 GMT',
  },
  {
    pxObjClass: 'Link-Attachment',
    pyCategory: 'File',
    pyMemo: 'Demo Word',
    pyTopic: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pxCreateDateTime: '2024-01-28T14:54:50.323Z',
    pxCreateOpName: 'John Smith',
    pyFileName: 'Test.docx',
    pzInsKey: 'LINK-ATTACHMENT DEMODOCX',
  },
  {
    pxObjClass: 'Link-Attachment',
    pyCategory: 'Image',
    pyMemo: 'Screenshot',
    pyTopic: 'image/png',
    pyFileName: 'demoImage.png',
    pxCreateDateTime: '2024-01-28T14:54:50.323Z',
    pxCreateOpName: 'Sue Lee',
    pzInsKey: 'LINK-ATTACHMENT DEMOPNG',
  },
];

/** The case's attachments, as the attachment endpoint returns them. */
export const caseAttachments = () => [
  {
    createdByName: 'John Smith',
    createdBy: 'jsmith',
    createTime: '2024-01-28T14:54:50.323Z',
    name: 'pega.com',
    links: {
      download: {
        rel: 'self',
        href: '/attachments/LINK-ATTACHMENT OK5NFJ-COMPUTER-WORK F-11012!20240128T145450.323 GMT',
        title: 'Retrieve the link',
        type: 'GET',
      },
    },
    ID: 'LINK-ATTACHMENT DEMOURL',
    mimeType: 'application/octet-stream',
    category: 'URL',
    type: 'URL',
    categoryName: 'URL',
  },
  {
    createdByName: 'Marc Doe',
    extension: 'png',
    fileName: 'DemoFile.png',
    mimeType: 'image/png',
    type: 'FILE',
    categoryName: 'Evidence',
    createdBy: 'marsr',
    createTime: '2024-01-28T13:18:43.205Z',
    name: 'DemoFile',
    links: {
      download: {
        rel: 'self',
        href: '/attachments/LINK-ATTACHMENT OK5NFJ-COMPUTER-WORK F-11012!20240128T131843.205 GMT',
        title: 'Download the attachment',
        type: 'GET',
      },
    },
    ID: 'LINK-ATTACHMENT DEMOPNG',
    category: 'Evidence',
  },
  {
    createdByName: 'Joe SMith',
    extension: 'docx',
    fileName: 'SampleWord.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    type: 'FILE',
    categoryName: 'File',
    createdBy: 'joe',
    createTime: '2024-01-28T13:18:43.193Z',
    name: 'SampleWord',
    links: {
      download: {
        rel: 'self',
        href: '/attachments/LINK-ATTACHMENT OK5NFJ-COMPUTER-WORK F-11012!20240128T131843.193 GMT',
        title: 'Download the attachment',
        type: 'GET',
      },
    },
    ID: 'LINK-ATTACHMENT DEMODOCX',
    category: 'File',
  },
  {
    createdByName: 'Marc Doe',
    extension: 'pdf',
    fileName: 'demoPDF.pdf',
    mimeType: 'application/pdf',
    type: 'FILE',
    categoryName: 'File',
    createdBy: 'marsr',
    createTime: '2024-01-28T13:18:43.193Z',
    name: 'demoPDF',
    links: {
      download: {
        rel: 'self',
        href: '/attachments/LINK-ATTACHMENT OK5NFJ-COMPUTER-WORK F-11012!20240128T131843.193 GMT',
        title: 'Download the attachment',
        type: 'GET',
      },
    },
    ID: 'LINK-ATTACHMENT DEMOPDF',
    category: 'File',
  },
  {
    createdByName: 'Marc Doe',
    extension: 'png',
    fileName: 'Screenshot 2024-01-25.png',
    mimeType: 'image/png',
    type: 'FILE',
    categoryName: 'File',
    createdBy: 'marsr',
    createTime: '2024-01-28T13:18:43.178Z',
    name: 'Screenshot 2024-01-25 PM',
    links: {
      download: {
        rel: 'self',
        href: '/attachments/LINK-ATTACHMENT OK5NFJ-COMPUTER-WORK F-11012!20240128T131843.178 GMT',
        title: 'Download the attachment',
        type: 'GET',
      },
    },
    ID: 'LINK-ATTACHMENT OK5NFJ-COMPUTER-WORK F-11012!20240128T131843.178 GMT',
    category: 'File',
  },
  {
    createdByName: 'Sue Lee',
    extension: 'png',
    fileName: 'Shipping Label.png',
    mimeType: 'image/png',
    type: 'FILE',
    categoryName: 'Shipping Label',
    createdBy: 'marsr',
    createTime: '2024-01-28T13:18:43.153Z',
    name: 'Shipping Label',
    links: {
      download: {
        rel: 'self',
        href: '/attachments/LINK-ATTACHMENT OK5NFJ-COMPUTER-WORK F-11012!20240128T131843.153 GMT',
        title: 'Download the attachment',
        type: 'GET',
      },
    },
    ID: 'LINK-ATTACHMENT OK5NFJ-COMPUTER-WORK F-11012!20240128T131843.153 GMT',
    category: 'Shipping Label',
  },
];

/**
 * Install the shared platform double for case F-11012. `downloadAttachment`
 * supplies a file's content, e.g. a story's sample files for previews.
 */
export const installDisplayAttachmentsPlatform = (
  downloadAttachment?: (id: string) => Promise<unknown>,
): PlatformFake =>
  installPlatformFake({
    caseInfo: { key: CASE_KEY },
    rows: attachmentRows(),
    caseAttachments: caseAttachments(),
    ...(downloadAttachment ? { downloadAttachment } : {}),
  });
