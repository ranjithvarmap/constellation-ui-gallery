import { createPlatform } from '../shared/platform';

type LoadDetailsProps = {
  id: string;
  classname: string;
  detailsDataPage: string;
  detailsViewName: string;
  getPConnect: any;
};

/* Loads the configured view for a case and returns it ready to render.
   The id parameter is the ID of the case (pyID). You can put when and custom
   conditions on the view's fields to customize how a card looks. */
export const loadDetails = async (props: LoadDetailsProps) => {
  const { id, classname, detailsDataPage, detailsViewName, getPConnect } = props;
  return createPlatform(getPConnect).views.loadDetailView({
    dataPage: detailsDataPage,
    viewName: detailsViewName,
    id,
    className: classname,
  });
};

type UpdateGroupValueProps = {
  groupValue: string;
  groupProperty: string;
  columns: any;
  setColumns: any;
  task: any;
  getPConnect: any;
};
/* This method will update the case groupValue automatically using the edit action
   triggered through the pyUpdateCaseDetails local action. You can run some post-processing through this local action to
   set other values in the case.

  if the groupProperty is pyWorkStatus, then once the case becomes 'Resolved' (e.g. starts with Resolved-) then it is not possible
  to change the status through the edit local action. This is the reason why the Task will becomes read-only if the GroupValue starts by 'Resolved-'
*/
export const updateGroupValue = async (props: UpdateGroupValueProps) => {
  const { groupValue, groupProperty, columns, setColumns, task, getPConnect } = props;

  await createPlatform(getPConnect).caseData.updateFields(task.insKey, {
    [groupProperty]: groupValue,
  });

  task.groupValue = groupValue;
  const newSourceTaskList = Array.from(columns[groupValue].taskList);
  setColumns({
    ...columns,
    [groupValue]: {
      ...columns[groupValue],
      taskList: newSourceTaskList,
    },
  });
};
