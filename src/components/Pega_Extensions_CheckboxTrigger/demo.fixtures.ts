/**
 * The platform a Checkbox Trigger runs against, shared by its story and its
 * test, so the test can assert on what the story's component actually does.
 */
import { installPlatformFake, type PlatformFake } from '../shared/platform/fake';

export const CONTEXT = 'app/modal_1';

/**
 * A data object open in a modal: its content in the store, its key on the
 * container item, and a savable data page that answers with the refreshed
 * record, including a value the platform computed.
 */
export const installCheckboxTriggerPlatform = (): PlatformFake =>
  installPlatformFake({
    contextName: CONTEXT,
    store: { [CONTEXT]: { dataInfo: { content: { classID: 'Data-Policy', Name: 'Home', Covered: false } } } },
    containerItems: { [CONTEXT]: { key: JSON.stringify({ pyGUID: 'G-1' }) } },
    restResponses: {
      createDataObject: {
        data: { responseData: { pzInsKey: 'DATA-POLICY G-1', Name: 'Home', Covered: true, Premium: 120 } },
      },
    },
    pConnect: { getTarget: () => 'modal', getStateProps: () => ({ value: '.Covered' }) },
  });
