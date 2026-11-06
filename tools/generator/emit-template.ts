/**
 * Emits a Template: a component that lays out regions App Studio authors fill.
 *
 * The runtime contract comes from Pega's own scaffolding
 * (@pega/custom-dx-components, templates/Constellation/Template):
 *  - Each CONTENTPICKER region arrives as one element of `children`, in
 *    config.json order. With one region it can arrive as a single element, not
 *    an array, so children are normalised with Children.toArray.
 *  - One region is laid out in a grid of `NumCols` columns (Pega's FORM);
 *    several regions get a column each (Pega's FORM-region).
 *  - DETAILS shows its regions read-only by setting `readOnly` and
 *    `displayMode` on each region's PConnect before it renders (Pega's DETAILS).
 */
import type { ResolvedTemplateSpec } from './define';
import { aboutBlock } from './emit-config';
import { emitStyles } from './emit-component';
import type { GeneratedFile } from './render';

const isSingle = (spec: ResolvedTemplateSpec) => spec.regions.length === 1;
const isDetails = (spec: ResolvedTemplateSpec) => spec.subtype === 'DETAILS';

/** The column count control Pega's FORM scaffold and FormFullWidth offer for one region. */
const numColsProperty = () => ({
  name: 'NumCols',
  label: 'Number of columns',
  format: 'SELECT',
  defaultValue: '1',
  source: [
    { key: '1', value: 'One' },
    { key: '2', value: 'Two' },
    { key: '3', value: 'Three' },
  ],
});

export const emitTemplateConfig = (spec: ResolvedTemplateSpec, builtOn = new Date()): string => {
  const authored = spec.properties.map((property) => ({
    name: property.name,
    label: property.label,
    format: property.format,
    ...(property.required ? { required: true } : {}),
    ...(property.config ?? {}),
  }));

  const regions = spec.regions.map((region) => ({
    name: region.name,
    label: region.label,
    format: 'CONTENTPICKER',
    addTypeList: region.accepts,
    ...(region.allowCreatingGroup ? { allowCreatingGroup: true } : {}),
  }));

  const config = {
    name: spec.componentKey,
    label: spec.label,
    description: spec.description,
    organization: spec.organization,
    version: spec.version,
    library: spec.library,
    allowedApplications: [],
    componentKey: spec.componentKey,
    type: 'Template',
    subtype: spec.subtype,
    properties: [
      { name: 'heading', label: 'Heading', format: 'TEXT' },
      ...(isSingle(spec) ? [numColsProperty()] : []),
      ...authored,
      ...regions,
      ...aboutBlock(spec, builtOn),
    ],
  };

  return `${JSON.stringify(config, null, 4)}\n`;
};

export const emitTemplateComponent = (spec: ResolvedTemplateSpec): string => {
  const name = spec.componentName;
  const wrapper = `Styled${name}Wrapper`;
  const single = isSingle(spec);
  const details = isDetails(spec);

  const authoredProps = spec.properties
    .map(
      (property) =>
        `  /** ${property.label} */\n  ${property.name}${property.required ? '' : '?'}: ${property.tsType};`,
    )
    .join('\n');

  /* Authored properties are typed but not destructured, for the same reason as
     in a generated Field: reading nothing from a destructured prop is the dead
     knob this tooling exists to prevent. */
  const authoredTodo = spec.properties.length
    ? `\n  /* TODO: wire up the authored properties. They are accepted and typed,
     but nothing reads them yet. Destructure them from \`props\` as you
     implement each one:
${spec.properties.map((property) => `       ${property.name}  // ${property.label}`).join('\n')} */\n`
    : '';

  const regionList = spec.regions.map((region) => ` *   - ${region.name}: ${region.label}`).join('\n');
  const authoredList = spec.properties.length
    ? spec.properties.map((property) => ` *   - ${property.name}: ${property.label}`).join('\n')
    : ' *   (none)';

  const imports = ['withConfiguration', 'FieldGroup', 'Grid', ...(single ? [] : ['Flex'])];
  const reactImports = ['Children', ...(details ? ['isValidElement'] : []), 'type ReactNode'];

  const readOnlyHelper = details
    ? `
/**
 * DETAILS shows its regions read-only. Each region's PConnect is told so
 * before the region renders, as Pega's own DETAILS template does, so the
 * fields inside render as values rather than inputs.
 */
const showReadOnly = (region: ReactNode) => {
  if (isValidElement<{ getPConnect?: () => any }>(region) && typeof region.props.getPConnect === 'function') {
    const pConn = region.props.getPConnect();
    pConn.setInheritedProp('readOnly', true);
    pConn.setInheritedProp('displayMode', 'DISPLAY_ONLY');
  }
};
`
    : '';

  const layout = single
    ? `  const columns = Number.parseInt(NumCols, 10) || 1;

  return (
    <${wrapper}>
      <FieldGroup name={heading}>
        <Grid container={{ cols: \`repeat(\${columns}, minmax(0, 1fr))\`, gap: 2 }}>{regions}</Grid>
      </FieldGroup>
    </${wrapper}>
  );`
    : `  return (
    <${wrapper}>
      <FieldGroup name={heading}>
        <Grid container={{ cols: \`repeat(\${Math.max(regions.length, 1)}, minmax(0, 1fr))\`, colGap: 6, alignItems: 'start' }}>
          {regions.map((region, index) => (
            <Flex container={{ direction: 'column', gap: 2 }} key={\`region-\${index + 1}\`}>
              {region}
            </Flex>
          ))}
        </Grid>
      </FieldGroup>
    </${wrapper}>
  );`;

  return `import { ${reactImports.join(', ')} } from 'react';
import { ${imports.join(', ')} } from '@pega/cosmos-react-core';
import '../shared/create-nonce';
import ${wrapper} from './styles';

/**
 * ${spec.description}
 *
 * Generated by tools/generator. The props below are emitted from the same spec
 * as config.json, so the property panel and this type cannot drift.
 *
 * Regions, one element of \`children\` each, in this order:
${regionList}
 *
 * Authored properties:
${authoredList}
 */
export type ${name}Props = {
  /** Heading shown above the regions; empty for none. */
  heading?: string;
${single ? `  /** Columns the region's content is laid out in. */\n  NumCols?: '1' | '2' | '3';\n` : ''}  /** One rendered element per region, in config.json order. */
  children?: ReactNode;
  /** PConnect accessor. */
  getPConnect?: () => any;
${authoredProps}
};
${readOnlyHelper}
export const ${name} = (props: ${name}Props) => {
  const { heading = '', ${single ? "NumCols = '1', " : ''}children } = props;
${authoredTodo}
  /* A single region can arrive as one element rather than an array of one. */
  const regions = Children.toArray(children);
${details ? '  regions.forEach(showReadOnly);\n' : ''}
${layout}
};

export default withConfiguration(${name});
`;
};

/** Sample content for a region in a story: a few field-like rows. */
const sampleFields = (regionLabel: string) => [1, 2, 3].map((n) => `${regionLabel} field ${n}`);

export const emitTemplateStories = (spec: ResolvedTemplateSpec): string => {
  const name = spec.componentName;
  const regions = spec.regions
    .map(
      (region) =>
        `      <Region fields={${JSON.stringify(sampleFields(region.label))}} getPConnect={createFakeGetPConnect()} />`,
    )
    .join('\n');

  const args = [
    `heading: '${spec.label.replace(/'/g, "\\'")}'`,
    ...(isSingle(spec) ? ["NumCols: '2'"] : []),
    ...spec.properties.map((property) => `${property.name}: ${property.defaultValue ?? "''"}`),
  ].join(',\n    ');

  return `import type { StoryObj } from '@storybook/react-webpack5';
import { createFakeGetPConnect } from '../shared/platform/fake';
import { ${name} } from './index';

/**
 * Stands in for a region the platform renders. Like a real one it carries a
 * PConnect and renders its fields as siblings, so they fill the grid.
 */
const Region = ({ fields }: { fields: string[]; getPConnect: () => any }) => (
  <>
    {fields.map((field) => (
      <div key={field}>{field}</div>
    ))}
  </>
);

export default {
  title: 'Templates/${spec.label}',
  argTypes: {
    getPConnect: { table: { disable: true } },
    children: { table: { disable: true } },
  },
  parameters: { a11y: { context: '#storybook-root' } },
  component: ${name},
};

type Story = StoryObj<typeof ${name}>;

export const Default: Story = {
  render: (args) => (
    <${name} {...args}>
${regions}
    </${name}>
  ),
  args: {
    ${args},
  },
};
`;
};

export const emitTemplateTest = (spec: ResolvedTemplateSpec): string => {
  const name = spec.componentName;
  const firstField = sampleFields(spec.regions[0].label)[0];
  const lastField = sampleFields(spec.regions[spec.regions.length - 1].label)[2];

  const readOnlyTest = isDetails(spec)
    ? `
test('shows every region read-only', () => {
  const regions = ${JSON.stringify(spec.regions.map((region) => region.name))}.map(() => createFakeGetPConnect());
  render(
    <${name}>
      {regions.map((getPConnect, index) => (
        <Region key={index} getPConnect={getPConnect} />
      ))}
    </${name}>,
  );

  for (const getPConnect of regions) {
    expect(getPConnect().getInheritedProps()).toMatchObject({ readOnly: true, displayMode: 'DISPLAY_ONLY' });
  }
});
`
    : '';

  /* Only the read-only test needs regions that carry a PConnect. */
  const regionFixture = isDetails(spec)
    ? `
/** A region the way the platform hands one over: an element carrying a PConnect. */
const Region = ({ getPConnect }: { getPConnect: () => any }) => <div>{getPConnect ? 'region' : ''}</div>;
`
    : '';

  return `import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
${isDetails(spec) ? "import { createFakeGetPConnect } from '../shared/platform/fake';\n" : ''}import * as stories from './demo.stories';
import { ${name} } from './index';

const { Default } = composeStories(stories);
${regionFixture}
test('renders the heading and the content of every region', () => {
  render(<Default />);
  expect(screen.getByText('${spec.label.replace(/'/g, "\\'")}')).toBeVisible();
  expect(screen.getByText('${firstField}')).toBeVisible();
  expect(screen.getByText('${lastField}')).toBeVisible();
});

/* Pega's own template notes that one region can arrive as a single element;
   code that calls children.map on it throws. */
test('accepts a single region passed as one element, not an array', () => {
  render(
    <${name} heading='One region'>
      <div>Only region</div>
    </${name}>,
  );
  expect(screen.getByText('Only region')).toBeVisible();
});

test('renders without any region', () => {
  render(<${name} heading='Empty' />);
  expect(screen.getByText('Empty')).toBeVisible();
});
${readOnlyTest}`;
};

export const emitTemplateDocs = (spec: ResolvedTemplateSpec): string => {
  const regionRows = spec.regions
    .map((region) => `| \`${region.name}\` | ${region.label} | ${region.accepts.join(', ')} |`)
    .join('\n');
  const propertyRows = spec.properties.length
    ? spec.properties.map((property) => `| \`${property.name}\` | ${property.format} | ${property.label} |`).join('\n')
    : '| _none_ | | |';

  return `import { Meta } from '@storybook/addon-docs/blocks';

<Meta title='Templates/${spec.label}/Docs' />

# ${spec.label}

${spec.description}

A ${spec.subtype} template${isDetails(spec) ? ' that shows its regions read-only' : ''}.

## Regions

Each region arrives as one element of \`children\`, in this order.

| Region | Label | Accepts |
| --- | --- | --- |
${regionRows}

## Authored properties

| Property | Format | Label |
| --- | --- | --- |
${propertyRows}

\`heading\`${isSingle(spec) ? ' and `NumCols`' : ''} are emitted for every ${isSingle(spec) ? 'single-region ' : ''}template.

## Notes

Generated by \`tools/generator\`. \`config.json\` and the props type in
\`index.tsx\` come from the same spec, so the property panel cannot offer a
control the component does not accept.
`;
};

export const renderTemplate = (spec: ResolvedTemplateSpec, builtOn?: Date): GeneratedFile[] => [
  { name: 'config.json', contents: emitTemplateConfig(spec, builtOn) },
  { name: 'index.tsx', contents: emitTemplateComponent(spec) },
  { name: 'styles.ts', contents: emitStyles(spec) },
  { name: 'demo.stories.tsx', contents: emitTemplateStories(spec) },
  { name: 'demo.test.tsx', contents: emitTemplateTest(spec) },
  { name: 'Docs.mdx', contents: emitTemplateDocs(spec) },
];
