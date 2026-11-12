/**
 * The platform a Map runs against, shared by its story and its tests.
 */
import { installPlatformFake, type PlatformFake } from '../shared/platform/fake';

/**
 * View metadata as the platform hands it over: three positions in the
 * embedded `.Positions` list, a latitude and a longitude column.
 */
const mapView = (selectionProperty = '') => {
  const region = {
    name: 'A',
    type: 'Region',
    children: [
      { type: 'ScalarList', config: { values: [34, 30, 35], value: '@FILTERED_LIST .Positions[].pxPositionLatitude' } },
      {
        type: 'ScalarList',
        config: { values: [-118, -110, -114], value: '@FILTERED_LIST .Positions[].pxPositionLongitude' },
      },
    ],
    getPConnect: () => ({ getRawMetadata: () => region }),
  };
  return {
    name: 'demoView',
    type: 'View',
    config: { template: 'Map', ruleClass: 'Work-', inheritedProps: [], selectionProperty },
    children: [region],
    classID: 'Work-MyComponents',
  };
};

/** Install the shared platform double, with the PConnect a Map reads. */
export const installMapPlatform = (selectionProperty = ''): PlatformFake => {
  const view = mapView(selectionProperty);
  return installPlatformFake({
    pConnect: {
      meta: { name: view.name },
      options: { viewName: '' },
      getTarget: () => 'caseInfo',
      getChildren: () => view.children,
      getRawMetadata: () => view,
      getInheritedProps: () => view.config.inheritedProps,
      /* The platform resolves each list reference to its values. */
      resolveConfigProps: (config: { values: unknown[] }) => ({ value: config.values }),
    },
  });
};
