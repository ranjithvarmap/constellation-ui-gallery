import { withConfiguration, Flex, Button } from '@pega/cosmos-react-core';
import '../shared/create-nonce';
import { createPlatform } from '../shared/platform';

type ActionableButtonProps = {
  label: string;
  value: string;
  localAction: string;
  getPConnect: any;
};

export const PegaExtensionsActionableButton = (props: ActionableButtonProps) => {
  const { getPConnect, label, value, localAction } = props;
  if (value && localAction) {
    const availableActions = createPlatform(getPConnect).caseInfo.availableActions();
    const targetAction = availableActions.find((action) => action.ID === localAction);
    const localizedLabel =
      getPConnect().getContainerName() === 'primary'
        ? getPConnect().getLocalizedValue(
            label,
            undefined,
            `${getPConnect().getCaseInfo().getClassName().toUpperCase()}!VIEW!PYCASESUMMARY`,
          )
        : label;
    const actionName = targetAction?.name || localizedLabel;
    const LaunchLocalAction = async () => {
      const actionsAPI = getPConnect().getActionsApi();
      if (getPConnect().getContainerName() === 'workarea') {
        await actionsAPI.saveAssignment(getPConnect().getContextName());
      }
      actionsAPI.openLocalAction(localAction, {
        caseID: value,
        containerName: 'modal',
        type: 'express',
        name: actionName,
      });
    };
    return (
      <Flex container={{ direction: 'row' }}>
        <Button onClick={LaunchLocalAction}>{localizedLabel}</Button>
      </Flex>
    );
  }
  return null;
};

export default withConfiguration(PegaExtensionsActionableButton);
