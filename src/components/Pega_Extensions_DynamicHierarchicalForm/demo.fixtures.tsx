/**
 * The platform a Dynamic Hierarchical Form runs against, shared by its story
 * and its test, so the test can assert on what the story's component does.
 */
import { Grid, Input, TextArea } from '@pega/cosmos-react-core';
import { installPlatformFake, type PlatformFake } from '../shared/platform/fake';

export const CONTEXT = 'app/primary_1';

/** `.Products`, as the case holds it: every product selected, each of its own class. */
const productsOf = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    pyLabel: `Product #${i + 1}`,
    pyGUID: `product${i + 1}`,
    IsSelected: true,
    RuleClass: `Class-Product-${i + 1}`,
  }));

/**
 * View metadata as the platform hands it over: a Selection region that names
 * the product list, and a Tabs region with one embedded view per product
 * class, each authored on its own row of `.Products`.
 */
const formView = (count: number) => {
  const selection = {
    name: 'Selection',
    type: 'Region',
    children: [
      {
        type: 'reference',
        config: { authorContext: '.Products', inheritedProps: [{ prop: 'label', value: 'Products' }] },
      },
    ],
  };
  const tabs = {
    name: 'Tabs',
    type: 'Region',
    children: Array.from({ length: count }, (_, i) => ({
      type: 'reference',
      config: { name: `ProductDetails${i + 1}`, ruleClass: `Class-Product-${i + 1}`, context: `.Products[${i}]` },
    })),
  };
  return {
    name: 'demoView',
    type: 'View',
    config: { template: 'DynamicHierarchicalForm', ruleClass: 'Work-', inheritedProps: [] },
    children: [selection, tabs],
  };
};

/** Install the shared platform double, with `count` products on the case. */
export const installHierarchicalFormPlatform = (count = 3): PlatformFake => {
  const view = formView(count);
  return installPlatformFake({
    contextName: CONTEXT,
    store: { [CONTEXT]: { caseInfo: { content: { Products: productsOf(count) } } } },
    /* A product's form: the view named for its class, on its own row. */
    renderView: (meta: any, options) => (
      <Grid container={{ gap: 1, cols: 'repeat(1, minmax(0, 1fr))' }} style={{ maxWidth: '80ch' }}>
        <Input label={`${meta.name} name`} />
        <TextArea label={`${meta.name} notes`} />
        <span>{`Rendered on ${options.pageReference}`}</span>
      </Grid>
    ),
    pConnect: {
      meta: { name: view.name },
      getTarget: () => 'caseInfo',
      getChildren: () => view.children,
      getRawMetadata: () => view,
      resolveConfigProps: (config: unknown) => config,
    },
  });
};
