import { Button, useToaster } from '@pega/cosmos-react-core';
import type { ActionButtonData, ActionButtonsProps } from './types';
import { ActionButtonsWrapper, HideActionButtons } from './styles';
import { createPlatform } from '../shared/platform';

export default function ActionButtons({ getPConnect }: ActionButtonsProps) {
  const toasterCtx = useToaster();

  const actionsButtonData = createPlatform(getPConnect).caseInfo.actionButtons<ActionButtonData>() as ActionButtonData;

  const actionsAPI = getPConnect().getActionsApi();
  const context = getPConnect().getContextName();

  const localizedVal = (window as any).PCore.getLocaleUtils().getLocaleValue;
  const localeCategory = 'Assignment';

  function onSaveActionSuccess(data: any) {
    // skip publishing EVENT_CANCEL for save for later use-cases.
    actionsAPI.cancelAssignment(context, true).then(() => {
      (window as any).PCore.getPubSubUtils().publish(
        (window as any).PCore.getConstants().PUB_SUB_EVENTS.CASE_EVENTS.CREATE_STAGE_SAVED,
        data,
      );
    });
  }

  const handleBtnClick = (action: string) => {
    // Execute the JavaScript action associated with the button
    // This is a placeholder implementation; actual implementation may vary
    // depending on how jsAction is defined and executed in your environment
    switch (action) {
      case 'next':
      case 'submit':
        actionsAPI.finishAssignment(context, {
          outcomeID: '',
          jsActionQueryParams: {},
        });
        break;

      case 'cancel':
        actionsAPI.cancelAssignment(context, false);
        break;

      case 'save':
        actionsAPI.saveAssignment(context).then(() => {
          toasterCtx.push({
            id: `${context}-m${Date.now()}`,
            content: localizedVal('Assignment saved', localeCategory),
          });
          const caseID = getPConnect().getCaseInfo().getKey();
          const assignmentID = getPConnect().getCaseInfo().getAssignmentID();
          /* Read through the CaseInfo's own PConnect, as before the facade. */
          const caseType = createPlatform(() => getPConnect().getCaseInfo().c11nEnv).caseInfo.caseTypeId();
          onSaveActionSuccess({ caseType, caseID, assignmentID });
        });
        break;

      case 'back':
        actionsAPI.navigateToStep('previous', context);
        break;

      default:
        break;
    }
  };

  return (
    <ActionButtonsWrapper>
      {actionsButtonData &&
        actionsButtonData.secondary?.map((secondaryBtn) => {
          const { actionID, name } = secondaryBtn;
          return (
            <Button key={`action-button-${actionID}`} variant='secondary' onClick={() => handleBtnClick(actionID)}>
              {localizedVal(name, localeCategory) || name}
            </Button>
          );
        })}

      {actionsButtonData &&
        actionsButtonData.main?.map((primaryBtn) => {
          const { actionID, name } = primaryBtn;
          return (
            <Button key={`action-button-${actionID}`} onClick={() => handleBtnClick(actionID)} variant='primary'>
              {localizedVal(name, localeCategory) || name}
            </Button>
          );
        })}

      <HideActionButtons />
    </ActionButtonsWrapper>
  );
}
