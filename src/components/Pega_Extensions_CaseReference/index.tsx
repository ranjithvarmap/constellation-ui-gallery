import { type MouseEvent } from 'react';
import { withConfiguration, FormField, Link } from '@pega/cosmos-react-core';
import '../shared/create-nonce';
import { createPlatform } from '../shared/platform';

type CaseReferenceProps = {
  /** Field label, shown above the link in a form. Details views draw it themselves (detailFVLItem). */
  label?: string;
  /** Set by the platform; DISPLAY_ONLY means a details view is drawing the label. */
  displayMode?: 'DISPLAY_ONLY' | '';
  value: string;
  selectionProperty: string;
  getPConnect: any;
  refCaseClassName: string;
  allowPreview: boolean;
};

export const PegaExtensionsCaseReference = (props: CaseReferenceProps) => {
  const { getPConnect, selectionProperty, value, refCaseClassName, allowPreview, label, displayMode } = props;

  if (value && typeof selectionProperty === 'string' && selectionProperty.includes(' ')) {
    const caseID = selectionProperty.split(' ')[1];
    const key = selectionProperty;
    const platform = createPlatform(getPConnect);
    const linkURL = platform.links.caseUrl({
      caseKey: key,
      className: refCaseClassName,
      workId: caseID,
    });

    const link = (
      <Link
        href={linkURL}
        previewable={allowPreview}
        onPreview={() => {
          platform.caseActions.preview(key, refCaseClassName);
        }}
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          /* for links - need to set onClick for spa to avoid full reload - (cmd | ctrl) + click for opening in new tab */
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            platform.caseActions.open(key, refCaseClassName);
          }
        }}
      >
        {value}
      </Link>
    );
    if (displayMode === 'DISPLAY_ONLY' || !label) return link;

    return (
      <FormField label={label} labelAs='span'>
        {link}
      </FormField>
    );
  }
  return null;
};

export default withConfiguration(PegaExtensionsCaseReference);
