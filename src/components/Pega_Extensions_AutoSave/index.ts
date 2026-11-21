import { useEffect } from 'react';
import '../shared/create-nonce';
import { createPlatform } from '../shared/platform';

type AutoSaveProps = {
  propertyName: string;
  getPConnect: any;
};

export const PegaExtensionsAutoSave = (props: AutoSaveProps) => {
  const { getPConnect, propertyName = '' } = props;
  const pConn = getPConnect();

  useEffect(() => {
    if (!propertyName) return;
    const saveAssignment = () => {
      /* Get the current case etag */
      const etag = pConn.getValue('caseInfo.headers.etag');

      const caseInfo = createPlatform(() => pConn).caseInfo;
      const assignmentID = caseInfo.assignmentId();
      const actionID = caseInfo.actionId();

      const content: Record<string, any> = {};
      const lastSeparator = propertyName.lastIndexOf('.');
      content[propertyName.substring(lastSeparator + 1)] = pConn.getValue(propertyName);

      /* Saves the field, then stores the etag the save returns. */
      createPlatform(() => pConn).caseData.saveAssignment({
        assignmentId: assignmentID,
        actionId: actionID,
        etag,
        content,
      });
    };
    /* Save on every change to the field; the returned teardown unregisters it. */
    return createPlatform(() => pConn).fields.onChange([propertyName], saveAssignment);
  }, [pConn, propertyName]);

  if (!propertyName) return null;
  return null;
};

export default PegaExtensionsAutoSave;
