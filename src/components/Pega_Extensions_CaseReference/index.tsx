import { type MouseEvent } from 'react';
import { withConfiguration, Link } from '@pega/cosmos-react-core';
import '../shared/create-nonce';
import { createPlatform } from '../shared/platform';

type ActionableButtonProps = {
  value: string;
  selectionProperty: string;
  getPConnect: any;
  refCaseClassName: string;
  allowPreview: boolean;
};

export const PegaExtensionsCaseReference = (props: ActionableButtonProps) => {
  const { getPConnect, selectionProperty, value, refCaseClassName, allowPreview } = props;

  if (value && typeof selectionProperty === 'string' && selectionProperty.includes(' ')) {
    const caseID = selectionProperty.split(' ')[1];
    const key = selectionProperty;
    const platform = createPlatform(getPConnect);
    const linkURL = platform.links.caseUrl({
      caseKey: key,
      className: refCaseClassName,
      workId: caseID,
    });

    return (
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
  }
  return null;
};

export default withConfiguration(PegaExtensionsCaseReference);
