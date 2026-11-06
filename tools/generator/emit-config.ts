/**
 * Emits config.json from a spec, reproducing the property-panel conventions
 * the existing 55 components share (all 55 carry the About block; 29 carry the
 * Conditions group) rather than leaving each author to retype them.
 */
import type { ResolvedBase, ResolvedFieldSpec } from './define';

const ICONS: Record<string, string | undefined> = {
  Boolean: 'images/pz-checkbox-active.svg',
  Date: 'images/pz-text-input-active.svg',
  Integer: 'images/pz-integer-active.svg',
  'Text-URL': 'images/pz-url-active.svg',
};

/** The label pair every field carries; the platform resolves it via defaultConfig. */
const labelProperties = () => [
  {
    name: 'labelOption',
    label: 'Label value',
    format: 'SELECT',
    defaultValue: 'custom',
    source: [
      { key: 'default', value: 'Default' },
      { key: 'custom', value: 'Custom' },
    ],
  },
  {
    name: 'label',
    label: 'Custom label value',
    format: 'VALUEINPUT',
    required: true,
    ruleType: 'Paragraph',
  },
];

const inputSettingsGroup = (settings: string[]) => {
  const known: Record<string, object> = {
    placeholder: { name: 'placeholder', label: 'Placeholder', format: 'TEXT' },
    helperText: { name: 'helperText', label: 'Helper text', format: 'TEXT' },
  };
  const properties = settings.map((setting) => known[setting]).filter(Boolean);
  if (!properties.length) return [];
  return [
    {
      label: 'Input settings',
      format: 'GROUP',
      visibility: '(!readOnly = true)',
      properties,
    },
  ];
};

const conditionsGroup = () => ({
  label: 'Conditions',
  format: 'GROUP',
  properties: [
    { name: 'required', label: 'Required', format: 'REQUIRED', visibility: '(!readOnly = true)' },
    { name: 'disabled', label: 'Disabled', format: 'DISABLED', visibility: '(!readOnly = true)' },
    { name: 'visibility', label: 'Visibility', format: 'VISIBILITY' },
  ],
});

const advancedGroup = () => ({
  label: 'Advanced',
  format: 'GROUP',
  collapsible: true,
  properties: [
    {
      name: 'testId',
      label: 'Test ID',
      format: 'TEXT',
      ignorePattern: '[^-_\\p{N}\\p{L}]',
      includeAnnotations: false,
    },
  ],
});

/** The About block every gallery component ends its property panel with. */
export const aboutBlock = (spec: ResolvedBase, builtOn: Date) => [
  { format: 'LABEL', label: 'About', name: 'PegaAboutLabel', variant: 'h3' },
  {
    format: 'LABEL',
    label: `${spec.organization}_${spec.library} ${spec.version}, ${builtOn.toDateString()}`,
    name: 'PegaAboutData',
    variant: 'primary',
  },
];

export const emitConfig = (spec: ResolvedFieldSpec, builtOn = new Date()): string => {
  const authored = spec.properties.map((property) => ({
    name: property.name,
    label: property.label,
    format: property.format,
    ...(property.required ? { required: true } : {}),
    ...(property.config ?? {}),
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
    type: 'Field',
    subtype: spec.subtype,
    ...(ICONS[spec.subtype] ? { icon: ICONS[spec.subtype] } : {}),
    properties: [
      ...labelProperties(),
      ...authored,
      { name: 'readOnly', label: 'Edit mode', format: 'READONLY' },
      ...inputSettingsGroup(spec.inputSettings),
      conditionsGroup(),
      advancedGroup(),
      ...aboutBlock(spec, builtOn),
    ],
    defaultConfig: { label: '@L $this.label', detailFVLItem: true },
  };

  return `${JSON.stringify(config, null, 4)}\n`;
};
