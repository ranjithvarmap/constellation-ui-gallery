/**
 * The platform a Rating Layout runs against, shared by its story and its test,
 * so the test can assert on what the story's component actually does.
 */
import { installPlatformFake, type PlatformFake } from '../shared/platform/fake';

type Child = {
  config: { values?: unknown[]; value?: string; text?: string };
  type: string;
};

/**
 * View metadata for a Rating Layout over `.Ratings`: one region holding three
 * scalar lists (category, label, value), as the platform hands them over.
 * Values are deterministic so a test knows where a slider starts.
 */
export const ratingsView = (numCategories: number, numRatings: number) => {
  const categories: string[] = [];
  const labels: string[] = [];
  const values: number[] = [];
  for (let i = 1; i <= numCategories; i += 1) {
    for (let j = 1; j <= numRatings; j += 1) {
      categories.push(`Category #${i}`);
      labels.push(`Category #${i} - label #${j}`);
      values.push(((i + j) % 5) + 1);
    }
  }

  const region = {
    name: 'A',
    type: 'Region',
    children: [
      { config: { values: categories, value: '@FILTERED_LIST .Ratings[].Category' }, type: 'ScalarList' },
      { config: { values: labels, value: '@FILTERED_LIST .Ratings[].Label' }, type: 'ScalarList' },
      { config: { values, value: '@FILTERED_LIST .Ratings[].Value' }, type: 'ScalarList' },
    ] as Child[],
    getPConnect: () => ({ getRawMetadata: () => region }),
  };

  return {
    name: 'demoView',
    type: 'View',
    config: { template: 'RatingLayout', ruleClass: 'Work-', inheritedProps: [] },
    children: [region],
    classID: 'Work-MyComponents',
    values,
  };
};

/** Install the shared platform double, with the PConnect a Rating Layout reads. */
export const installRatingLayoutPlatform = (numCategories = 3, numRatings = 3): PlatformFake => {
  const view = ratingsView(numCategories, numRatings);
  return installPlatformFake({
    pConnect: {
      getChildren: () => view.children,
      getRawMetadata: () => view,
      getTarget: () => 'caseInfo',
      createComponent: (config: Child) => config.config.text,
      resolveConfigProps: (config: { values: unknown[] }) => ({ value: config.values }),
    },
  });
};
