/**
 * The platform a Jaw Layout runs against, shared by its story and its test,
 * so the test can assert on what the story's component actually does.
 */
import { installPlatformFake, type PlatformFake } from '../shared/platform/fake';
import localizations from './localizations.json';

/** One status per tooth position: '' healthy, M missing, E extracted, X not in records. */
export const toothStatuses = [
  'M',
  '',
  '',
  '',
  'E',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  'X',
  'E',
  '',
  '',
  '',
  'M',
  '',
  '',
  '',
  '',
  'X',
  '',
  '',
  'M',
  '',
  '',
  '',
  '',
  'E',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  'X',
  '',
  '',
  'E',
  '',
  '',
  '',
  'M',
  '',
  '',
];

/**
 * View metadata as the platform hands it over: the region's field carries the
 * raw `@FILTERED_LIST` reference, from which the layout derives the embedded
 * list (`ToothData`) and the status property (`ToothStatus`).
 */
export const jawView = () => {
  const field = {
    type: 'ScalarList',
    config: { value: '@FILTERED_LIST .ToothData[].ToothStatus', label: 'Tooth Status' },
  };
  const region = {
    name: 'A',
    type: 'Region',
    config: {},
    children: [field],
    getPConnect: () => ({ getRawMetadata: () => region }),
  };
  return {
    name: 'demoView',
    type: 'View',
    config: { template: 'Pega_Extensions_JawLayout', ruleClass: 'Work-', heading: 'dental chart' },
    children: [region],
    classID: 'Work-MyComponents',
  };
};

/** Install the shared platform double, with the PConnect a Jaw Layout reads. */
export const installJawLayoutPlatform = (statuses: string[] = toothStatuses): PlatformFake => {
  const view = jawView();
  return installPlatformFake({
    pConnect: {
      /* A real PConnect carries its view's metadata; the layout registers its
         list with the context tree under this name. */
      meta: { name: view.name },
      getLocalizedValue: (key: string) => (localizations.fields as Record<string, string>)[key] || key,
      getTarget: () => 'app/primary_1',
      getChildren: () => view.children,
      getRawMetadata: () => view,
      /* The platform resolves the list reference to the statuses themselves. */
      resolveConfigProps: (config: { value: unknown; label?: string }) => ({ ...config, value: statuses }),
    },
  });
};
