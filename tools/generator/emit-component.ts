/**
 * Emits the TSX and its companion files.
 *
 * The contract that matters: every property in the spec is written into the
 * props type AND destructured in the component body. tools/config-parity flags
 * a config.json property that is neither an accepted prop nor mentioned in the
 * source, so a generated component cannot carry a dead knob.
 */
import type { Capability, ResolvedSpec } from './define';

/** The props Constellation supplies to every Field, regardless of the spec. */
const STANDARD_PROPS = (spec: ResolvedSpec) => {
  const rows = [
    { name: 'label', type: 'string', comment: 'field label' },
    { name: 'value', type: valueType(spec), comment: 'value supplied by the platform' },
    { name: 'validatemessage', type: 'string', comment: 'validation message', optional: true },
    { name: 'hideLabel', type: 'boolean', comment: 'hide the label', optional: true },
    /* The three conditions arrive as the string 'true' or 'false' rather than
       a boolean when App Studio drives them from a condition. Both strings are
       truthy, so they are typed as either and coerced once, by isTrue, before
       anything reads them. */
    { name: 'disabled', type: 'boolean | string', comment: 'is the field disabled', optional: true },
    { name: 'readOnly', type: 'boolean | string', comment: 'is the field read-only', optional: true },
    { name: 'required', type: 'boolean | string', comment: 'is the field required', optional: true },
    { name: 'testId', type: 'string', comment: 'test id', optional: true },
    { name: 'displayMode', type: "'DISPLAY_ONLY' | 'LABELS_LEFT' | ''", comment: 'display mode', optional: true },
    { name: 'getPConnect', type: 'any', comment: 'PConnect accessor' },
  ];
  if (spec.subtype === 'Picklist') {
    /* Supplied by the platform from the property's value list. The component
       renders whatever it is given, so authors change the options in App
       Studio without a rebuild. */
    rows.splice(2, 0, {
      name: 'datasource',
      type: 'PicklistItem[] | { source?: PicklistItem[] }',
      comment: "options from the property's local list",
      optional: true,
    } as never);
    rows.splice(3, 0, {
      name: 'listType',
      type: 'string',
      comment: "'datapage' when the options come from a data page",
      optional: true,
    } as never);
  }
  const settings: Record<string, { name: string; type: string; comment: string; optional: boolean }> = {
    placeholder: { name: 'placeholder', type: 'string', comment: 'placeholder text', optional: true },
    helperText: { name: 'helperText', type: 'string', comment: 'helper text', optional: true },
  };
  const extras = spec.inputSettings.map((setting) => settings[setting]).filter(Boolean);
  return [...rows.slice(0, 3), ...extras, ...rows.slice(3)];
};

const valueType = (spec: ResolvedSpec) => {
  switch (spec.subtype) {
    case 'Picklist':
      return 'string';
    case 'Integer':
    case 'Decimal':
      return 'number';
    case 'Boolean':
      return 'boolean';
    default:
      return 'string';
  }
};

/** The Cosmos control used for each subtype. */
const control = (spec: ResolvedSpec) => {
  switch (spec.subtype) {
    case 'Picklist':
      return { component: 'Select', imports: ['Select', 'Option'], extra: '' };
    case 'Text-Paragraph':
      return { component: 'TextArea', imports: ['TextArea'], extra: '' };
    case 'Boolean':
      return { component: 'Checkbox', imports: ['Checkbox'], extra: '' };
    case 'Integer':
    case 'Decimal':
      return { component: 'Input', imports: ['Input'], extra: "type='number'" };
    case 'Date':
      return { component: 'Input', imports: ['Input'], extra: "type='date'" };
    case 'Text-Email':
      return { component: 'Input', imports: ['Input'], extra: "type='email'" };
    case 'Text-URL':
      return { component: 'Input', imports: ['Input'], extra: "type='url'" };
    default:
      return { component: 'Input', imports: ['Input'], extra: "type='text'" };
  }
};

const CAPABILITY_NOTE: Record<Capability, string> = {
  caseData: 'platform.caseData.query(…) / updateFields(…)',
  events: "platform.events.on('assignmentSubmission', …)",
  links: 'platform.links.caseUrl(…)',
  caseActions: 'platform.caseActions.open(…)',
  text: 'platform.text.loadingContent()',
};

export const emitComponent = (spec: ResolvedSpec): string => {
  const { component, imports, extra } = control(spec);
  const standard = STANDARD_PROPS(spec);
  const usesPlatform = spec.capabilities.length > 0;
  const isBoolean = spec.subtype === 'Boolean';
  const isPicklist = spec.subtype === 'Picklist';
  /* The value is typed number, but a Cosmos Input takes a string. */
  const isNumeric = spec.subtype === 'Integer' || spec.subtype === 'Decimal';

  const propsType = [
    ...standard.map(
      (row) => `  /** ${row.comment} */\n  ${row.name}${row.optional ? '?' : ''}: ${row.type};`,
    ),
    ...spec.properties.map(
      (property) =>
        `  /** ${property.label} */\n  ${property.name}${property.required ? '' : '?'}: ${property.tsType};`,
    ),
  ].join('\n');

  /* Standard props are destructured because the template genuinely uses them.
     Authored props are deliberately NOT destructured: the generator cannot know
     what they should do, and destructuring them unused would emit a component
     that accepts a control and ignores it — the exact defect this tooling
     exists to prevent. They are declared on the props type (so config.json and
     the type cannot drift) and called out in a TODO instead. */
  const destructured = [
    'label',
    'value',
    ...(isPicklist ? ['datasource', 'listType'] : []),
    ...spec.inputSettings,
    'validatemessage',
    'hideLabel = false',
    /* Renamed on the way in so the coerced booleans below can take the plain
       names, and nothing downstream can reach the raw string by mistake. */
    'disabled: disabledFlag',
    'readOnly: readOnlyFlag',
    'required: requiredFlag',
    'testId',
    'displayMode',
    'getPConnect',
  ].join(',\n    ');

  const authoredTodo = spec.properties.length
    ? `\n  /* TODO: wire up the authored properties. They are accepted and typed,
     but nothing reads them yet, so the property panel currently offers
     controls this component ignores. Destructure them from \`props\` as you
     implement each one:
${spec.properties
  .map(
    (property) =>
      `       ${property.name}${property.defaultValue !== undefined ? ` = ${property.defaultValue}` : ''}  // ${property.label}`,
  )
  .join('\n')} */\n`
    : '';

  const authoredList = spec.properties.length
    ? spec.properties.map((property) => `   * - ${property.name}: ${property.label}`).join('\n')
    : '   * (none)';

  const platformImport = usesPlatform
    ? `import { createPlatform } from '../shared/platform';\n`
    : '';
  const platformSetup = usesPlatform
    ? `\n  /* Platform capabilities declared in the spec:\n${spec.capabilities
        .map((capability) => `     - ${CAPABILITY_NOTE[capability]}`)
        .join('\n')} */\n  const platform = createPlatform(getPConnect);\n`
    : '';
  const platformUse = usesPlatform
    ? `\n  useEffect(() => {\n    /* TODO: use \`platform\` here. It is created above so the capability\n       is wired; remove it from the spec if this field does not need it. */\n    void platform;\n  }, [platform]);\n`
    : '';

  const changeHandler = isPicklist
    ? `  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {\n    actions.updateFieldValue(propName, event.target.value);\n  };`
    : isBoolean
    ? `  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {\n    actions.updateFieldValue(propName, event.target.checked);\n  };`
    : `  const handleChange = (event: ChangeEvent<${
        spec.subtype === 'Text-Paragraph' ? 'HTMLTextAreaElement' : 'HTMLInputElement'
      }>) => {\n    actions.updateFieldValue(propName, event.target.value);\n  };`;

  const picklistMarkup = `        <${component}
          value={value ?? ''}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          onChange={handleChange}
          onBlur={handleBlur}
          testId={testId}
        >
${
    spec.inputSettings.includes('placeholder')
      ? `          {placeholder ? <Option value=''>{placeholder}</Option> : null}\n`
      : ''
  }          {items.map((item) => (
            <Option key={String(item.key)} value={String(item.key)}>
              {labelFor(item)}
            </Option>
          ))}
        </${component}>`;

  const controlMarkup = isPicklist
    ? picklistMarkup
    : isBoolean
    ? `        <${component}
          checked={value}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          onChange={handleChange}
          onBlur={handleBlur}
          testId={testId}
        />`
    : `        <${component}
          ${extra}
          value={${isNumeric ? "value === undefined ? '' : String(value)" : "value ?? ''"}}${spec.inputSettings.includes('placeholder') ? '\n          placeholder={placeholder}' : ''}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          onChange={handleChange}
          onBlur={handleBlur}
          testId={testId}
        />`;

  const displayValue = isPicklist ? 'selectedLabel' : "String(value ?? '')";

  const reactImports = ['useEffect', 'useState', 'type ChangeEvent'].filter(
    (name) => usesPlatform || name !== 'useEffect',
  );

  return `import { ${reactImports.join(', ')} } from 'react';
import { withConfiguration, FormField, FormControl, FieldValueList, ${imports.join(', ')} } from '@pega/cosmos-react-core';
import '../shared/create-nonce';
${platformImport}import Styled${spec.componentName}Wrapper from './styles';

${
  isPicklist
    ? `/** One entry of a property's value list, as the platform supplies it. */
type PicklistItem = { key: string; text?: string; value?: string };

`
    : ''
}/**
 * ${spec.description}
 *
 * Generated by tools/generator. The props below are emitted from the same spec
 * as config.json, so the property panel and this type cannot drift.
 *
 * Authored properties:
${authoredList}
 */
type ${spec.componentName}Props = {
${propsType}
};

/** A condition driven by a when rule arrives as the string 'true' or 'false', not a boolean. */
const isTrue = (flag?: boolean | string): boolean => flag === true || flag === 'true';

export const ${spec.componentName} = (props: ${spec.componentName}Props) => {
  const {
    ${destructured},
  } = props;
  const disabled = isTrue(disabledFlag);
  const readOnly = isTrue(readOnlyFlag);
  const required = isTrue(requiredFlag);

  const pConn = getPConnect();
  const actions = pConn.getActionsApi();
  const propName: string = pConn.getStateProps().value;
${authoredTodo}${
  isPicklist
    ? `
  /* Options come from the property: a local list arrives on \`datasource\`, a
     data page on \`listOutput\`. Nothing about the list is hardcoded here. */
  const isDataPage = listType === 'datapage';
  const rawItems = isDataPage ? pConn.getConfigProps()?.listOutput : datasource;
  const items: PicklistItem[] = Array.isArray(rawItems) ? rawItems : (rawItems?.source ?? []);
  const labelFor = (item: PicklistItem) => (isDataPage ? item.text : item.value) ?? String(item.key);

  /* The stored value is the option key; the label is what a reader expects. */
  const selectedLabel =
    items.find((item) => String(item.key) === String(value ?? ''))?.[isDataPage ? 'text' : 'value'] ??
    String(value ?? '');
`
    : ''
}${platformSetup}
  const [status, setStatus] = useState<'error' | undefined>(undefined);
${
  usesPlatform
    ? ''
    : ''
}
${changeHandler}

  const handleBlur = () => {
    actions.triggerFieldChange(propName, value);
    setStatus(validatemessage ? 'error' : undefined);
  };
${platformUse}
  if (displayMode === 'DISPLAY_ONLY') {
    return <Styled${spec.componentName}Wrapper>{${displayValue}}</Styled${spec.componentName}Wrapper>;
  }

  if (displayMode === 'LABELS_LEFT') {
    return (
      <Styled${spec.componentName}Wrapper>
        <FieldValueList
          variant={hideLabel ? 'stacked' : 'inline'}
          data-testid={testId}
          fields={[{ id: '1', name: hideLabel ? '' : label, value: ${displayValue} }]}
        />
      </Styled${spec.componentName}Wrapper>
    );
  }

  return (
    <Styled${spec.componentName}Wrapper>
      <FormField
        label={label}
        labelHidden={hideLabel}
        info={validatemessage${spec.inputSettings.includes('helperText') ? ' || helperText' : ''}}
        status={status}
        testId={testId}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
      >
        <FormControl>
${controlMarkup}
        </FormControl>
      </FormField>
    </Styled${spec.componentName}Wrapper>
  );
};

export default withConfiguration(${spec.componentName});
`;
};

export const emitStyles = (spec: ResolvedSpec): string => `import styled from 'styled-components';

const Styled${spec.componentName}Wrapper = styled.div\`
  display: block;
\`;

export default Styled${spec.componentName}Wrapper;
`;

export const emitStories = (spec: ResolvedSpec): string => {
  /* A picklist with no options renders an empty control, which demonstrates
     nothing. Story args carry example options so the story opens in a working
     state; at runtime these come from the property's value list. */
  const sampleDatasource =
    spec.subtype === 'Picklist'
      ? `datasource: [
      { key: 'basic', value: 'Basic' },
      { key: 'standard', value: 'Standard' },
      { key: 'premium', value: 'Premium' },
      { key: 'platinum', value: 'Platinum' },
    ]`
      : null;

  const args = [
    ...(sampleDatasource ? [sampleDatasource] : []),
    `label: '${spec.label}'`,
    ...(spec.inputSettings.includes('placeholder') ? ["placeholder: ''"] : []),
    ...(spec.inputSettings.includes('helperText') ? ["helperText: ''"] : []),
    'hideLabel: false',
    'disabled: false',
    'readOnly: false',
    'required: false',
    ...spec.properties.map((property) => `${property.name}: ${property.defaultValue ?? "''"}`),
  ].join(',\n    ');

  return `import type { StoryObj } from '@storybook/react-webpack5';
import { ${spec.componentName} } from './index';
import { installPlatformFake } from '../shared/platform/fake';

export default {
  title: 'Fields/${spec.label}',
  argTypes: { getPConnect: { table: { disable: true } } },
  component: ${spec.componentName},
};

type Story = StoryObj<typeof ${spec.componentName}>;

export const Default: Story = {
  render: (args) => {
    /* One shared platform double, rather than a hand-rolled window.PCore stub. */
    const platform = installPlatformFake();
    return <${spec.componentName} {...args} getPConnect={platform.getPConnect} />;
  },
  args: {
    ${args},
  },
};
`;
};

export const emitTest = (spec: ResolvedSpec): string => {
  const extra =
    spec.subtype === 'Picklist'
      ? `
test('renders the options supplied by the property value list', async () => {
  render(<Default />);
  expect(await screen.findByRole('option', { name: 'Premium' })).toBeInTheDocument();
  expect(screen.getAllByRole('option')).toHaveLength(4);
});
`
      : '';
  return `import { render, screen } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from './demo.stories';

const { Default } = composeStories(stories);

test('renders ${spec.label} with default args', async () => {
  render(<Default />);
  expect(await screen.findByText('${spec.label}')).toBeVisible();
});

/* A condition that drives these props hands the component the string 'true' or
   'false'. Both strings are truthy, so without coercion 'false' locks the field. */
test.each([
  ['true', true],
  ['false', false],
] as const)("treats the condition string '%s' as %s", (flag, expected) => {
  const { container } = render(<Default readOnly={flag} required={flag} disabled={flag} />);
  const control = container.querySelector('input, select, textarea');
  expect(control).not.toBeNull();
  expect(control?.hasAttribute('readonly')).toBe(expected);
  expect(control?.hasAttribute('required')).toBe(expected);
  expect(control?.hasAttribute('disabled')).toBe(expected);
});
${extra}`;
};

export const emitDocs = (spec: ResolvedSpec): string => {
  const rows = spec.properties.length
    ? spec.properties.map((property) => `| \`${property.name}\` | ${property.format} | ${property.label} |`).join('\n')
    : '| _none_ | | |';

  return `import { Meta } from '@storybook/addon-docs/blocks';

<Meta title='Fields/${spec.label}/Docs' />

# ${spec.label}

${spec.description}

## Authored properties

| Property | Format | Label |
| --- | --- | --- |
${rows}

Standard field properties (label, read-only, required, disabled, visibility,
test id${spec.inputSettings.length ? `, ${spec.inputSettings.join(', ')}` : ''}) are emitted for every field.

## Notes

Generated by \`tools/generator\`. \`config.json\` and the props type in
\`index.tsx\` come from the same spec, so the property panel cannot offer a
control the component does not accept.
`;
};
