import { withConfiguration, Banner } from '@pega/cosmos-react-core';
import { useCallback, useEffect, useState } from 'react';
import MainContent from './styles';
import '../shared/create-nonce';
import { createPlatform } from '../shared/platform';

type BannerProps = {
  /** Display type of rendering
   * @default success
   */
  variant: 'success' | 'info' | 'warning' | 'urgent';
  /** Name of the data page to get the messages */
  dataPage?: string;
  /** Set this boolean to true if the banner can be dismissed
   * @default false
   */
  dismissible?: boolean;
  /** If dismissible is true, the component can call a case wide actions where you can perform some post-processing.
   */
  dismissAction?: string;
  getPConnect: any;
};

export const PegaExtensionsBanner = (props: BannerProps) => {
  const { variant = 'success', dataPage = '', dismissible = false, dismissAction = '', getPConnect } = props;
  const [messages, setMessages] = useState<Array<string>>([]);
  const [isDismissed, setIsDismissed] = useState(false);

  const updateItemDetails = () => {
    const caseInstanceKey = createPlatform(getPConnect).caseInfo.key();
    const context = getPConnect().getContextName();

    (window as any).PCore.getDataApiUtils()
      .getCaseEditLock(caseInstanceKey, context)
      .then((response: any) => {
        /* Upon successful, update the latest etag. */
        const updatedEtag = response.headers.etag;
        (window as any).PCore.getContainerUtils().updateCaseContextEtag(getPConnect().getContextName(), updatedEtag);
      });
  };

  const refreshForm = useCallback(() => {
    const caseInstanceKey = createPlatform(getPConnect).caseInfo.key();

    const className = createPlatform(getPConnect).caseInfo.className();
    createPlatform(getPConnect)
      .caseData.loadView({ caseKey: caseInstanceKey, className, viewId: 'pyCaseSummary' })
      .then((response: any) => {
        getPConnect().updateState({ caseInfo: response.data.data.caseInfo });
      });
  }, [getPConnect]);

  const dismissCaseWideAction = () => {
    const dataObj = getPConnect().getDataObject(getPConnect().getContextName());

    const caseInstanceKey = createPlatform(getPConnect).caseInfo.key();

    getPConnect()
      .getContainerManager()
      .addContainerItem({
        semanticURL: '',
        key: caseInstanceKey,
        data: {
          ...dataObj,
          caseInfo: {
            ...dataObj.caseInfo,
            activeActionID: dismissAction,
            isModalAction: false,
            viewType: 'form',
          },
        },
      });

    const items = Object.keys((window as any).PCore.getContainerUtils().getContainerItems('app/primary'));
    const tmpContainerName = items[items.length - 1];

    const page = createPlatform(getPConnect).pages.at('caseInfo.content', {
      meta: {
        config: {
          context: 'caseInfo.content',
          name: dismissAction,
        },
      },
      context: tmpContainerName,
      contextName: tmpContainerName,
    });

    try {
      page.actions
        .finishAssignment(page.contextName, {
          outcomeID: '',
          jsActionQueryParams: {},
        })
        .then(() => {
          getPConnect()
            .getContainerManager()
            .removeContainerItem({ target: 'app/primary', containerItemID: tmpContainerName });

          updateItemDetails();

          refreshForm();
        });
    } catch {
      /* Handle error */
    }
  };

  const loadMessages = useCallback(
    (dismissed?: boolean) => {
      if (dataPage) {
        const pConn = getPConnect();
        const CaseInstanceKey = createPlatform(() => pConn).caseInfo.key();
        const payload = {
          dataViewParameters: [{ pyID: CaseInstanceKey, ...(dismissed ? { dismissed: true } : null) }],
        };
        (window as any).PCore.getDataApiUtils()
          .getData(dataPage, payload, pConn.getContextName())
          .then((response: any) => {
            if (response.data.data !== null) {
              setMessages(response.data.data.map((message: any) => message.pyDescription));
              if (dismissed) {
                refreshForm();
              }
            }
          })
          .catch(() => {});
      }
    },

    [],
  );

  /* Initial Load of the content - Subscribe to changes to the assignment case */
  useEffect(() => {
    const caseID = createPlatform(getPConnect).caseInfo.key();
    const filter = {
      matcher: 'TASKLIST',
      criteria: {
        ID: caseID,
      },
    };
    const attachSubId = (window as any).PCore.getMessagingServiceManager().subscribe(
      filter,
      () => {
        loadMessages();
      },
      getPConnect().getContextName(),
    );
    loadMessages();
    return () => {
      (window as any).PCore.getMessagingServiceManager().unsubscribe(attachSubId);
    };
  }, []);

  const onDismiss = () => {
    setIsDismissed(true);

    if (dismissAction) {
      dismissCaseWideAction();
    } else {
      loadMessages(true);
    }
  };

  if (messages?.length === 0 || isDismissed) return null;
  return (
    <MainContent>
      <Banner variant={variant} messages={messages} onDismiss={dismissible ? onDismiss : undefined} />
    </MainContent>
  );
};

export default withConfiguration(PegaExtensionsBanner);
