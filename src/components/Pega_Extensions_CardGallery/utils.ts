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

export const getFilters = (filters: any) => {
  const tmpFilters = Object.entries(filters).map((i: any) => {
    return { ...i[1].condition, ignoreCase: true };
  });
  if (tmpFilters.length === 0) return null;
  let logic = '';
  const filterConditions: any = {};
  for (let i = 0; i < tmpFilters.length; i += 1) {
    logic = `${logic + (i > 0 ? ' AND ' : '')}T${i + 1}`;
    filterConditions[`T${i + 1}`] = tmpFilters[i];
  }
  return {
    logic,
    filterConditions,
  };
};
