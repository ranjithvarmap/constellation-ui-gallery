/**
 * The component spec: one description of a Field from which both `config.json`
 * and the TSX props type are emitted.
 *
 * That single source is the point. When the property panel and the props type
 * are authored separately — as they are for all 55 existing components — they
 * drift, and App Studio ends up offering knobs the component never reads.
 * tools/config-parity found 17 such knobs, every one of them in a Field.
 */

/** Field subtypes the generator can emit a working control for. */
export type FieldSubtype =
  | 'Text'
  | 'Picklist'
  | 'Text-Paragraph'
  | 'Text-Email'
  | 'Text-URL'
  | 'Integer'
  | 'Decimal'
  | 'Boolean'
  | 'Date';

/** One authored property: its config.json shape and its TypeScript type. */
export type PropertySpec = {
  name: string;
  label: string;
  /** config.json `format`. */
  format: string;
  /** Type written into the generated props type. */
  tsType: string;
  /** Extra keys merged into the config.json entry (source, defaultValue, …). */
  config?: Record<string, unknown>;
  /** Whether the prop is optional in TS. Defaults to true. */
  required?: boolean;
  /** Default written into the component's destructuring. */
  defaultValue?: string;
};

const quote = (value: string) => `'${value.replace(/'/g, "\\'")}'`;

/** Builders for authored properties. Each keeps format and tsType together. */
export const p = {
  text: (name: string, label: string, options: { defaultValue?: string } = {}): PropertySpec => ({
    name,
    label,
    format: 'TEXT',
    tsType: 'string',
    ...(options.defaultValue !== undefined
      ? { config: { defaultValue: options.defaultValue }, defaultValue: quote(options.defaultValue) }
      : {}),
  }),

  number: (name: string, label: string, options: { defaultValue?: number } = {}): PropertySpec => ({
    name,
    label,
    format: 'NUMBER',
    tsType: 'number',
    ...(options.defaultValue !== undefined
      ? { config: { defaultValue: options.defaultValue }, defaultValue: String(options.defaultValue) }
      : {}),
  }),

  boolean: (name: string, label: string, options: { defaultValue?: boolean } = {}): PropertySpec => ({
    name,
    label,
    format: 'BOOLEAN',
    tsType: 'boolean',
    ...(options.defaultValue !== undefined
      ? { config: { defaultValue: options.defaultValue }, defaultValue: String(options.defaultValue) }
      : {}),
  }),

  /**
   * A dropdown. The TS type is the union of the option keys, so an invalid
   * value is a compile error rather than a runtime surprise.
   */
  select: (
    name: string,
    label: string,
    choices: { key: string; value: string }[],
    options: { defaultValue?: string } = {},
  ): PropertySpec => ({
    name,
    label,
    format: 'SELECT',
    tsType: choices.map((choice) => quote(choice.key)).join(' | '),
    config: {
      source: choices,
      ...(options.defaultValue !== undefined ? { defaultValue: options.defaultValue } : {}),
    },
    ...(options.defaultValue !== undefined ? { defaultValue: quote(options.defaultValue) } : {}),
  }),

  /** A data page name. */
  dataPage: (name: string, label: string): PropertySpec => ({
    name,
    label,
    format: 'DATAPAGE',
    tsType: 'string',
  }),
};

/** Optional entries in the "Input settings" group. */
export type InputSetting = 'placeholder' | 'helperText';

/** Platform capabilities to wire through the shared facade. */
export type Capability = 'caseData' | 'events' | 'links' | 'caseActions' | 'text';

export type FieldSpec = {
  /** Bare name; the component key becomes `Pega_Extensions_<name>`. */
  name: string;
  /** Label shown in App Studio. */
  label: string;
  description: string;
  subtype: FieldSubtype;
  /** Authored properties, beyond the standard field set. */
  properties?: PropertySpec[];
  /** Which optional input settings to expose. Defaults to both. */
  inputSettings?: InputSetting[];
  /** Facade capabilities the component needs. Omit for a presentational field. */
  capabilities?: Capability[];
  organization?: string;
  library?: string;
  version?: string;
};

export type ResolvedSpec = Required<
  Pick<FieldSpec, 'name' | 'label' | 'description' | 'subtype' | 'organization' | 'library' | 'version'>
> & {
  properties: PropertySpec[];
  inputSettings: InputSetting[];
  capabilities: Capability[];
  /** `Pega_Extensions_Foo` — the folder name and componentKey. */
  componentKey: string;
  /** `PegaExtensionsFoo` — the exported React component name. */
  componentName: string;
};

const RESERVED = new Set([
  'label',
  'value',
  'validatemessage',
  'helperText',
  'hideLabel',
  'placeholder',
  'disabled',
  'readOnly',
  'required',
  'testId',
  'displayMode',
  'getPConnect',
  'labelOption',
  'visibility',
]);

/**
 * Validate and normalise a spec. Throws on anything that would produce a
 * component that cannot compile or that collides with the standard field props.
 */
export const defineField = (spec: FieldSpec): ResolvedSpec => {
  if (!/^[A-Z][A-Za-z0-9]*$/.test(spec.name)) {
    throw new Error(`name must be PascalCase with no separators, got "${spec.name}"`);
  }
  const properties = spec.properties ?? [];

  const seen = new Set<string>();
  for (const property of properties) {
    if (!/^[a-z][A-Za-z0-9]*$/.test(property.name)) {
      throw new Error(`property "${property.name}" must be camelCase`);
    }
    if (RESERVED.has(property.name)) {
      throw new Error(
        `property "${property.name}" collides with a standard field prop; the standard one is emitted for you`,
      );
    }
    if (seen.has(property.name)) throw new Error(`duplicate property "${property.name}"`);
    seen.add(property.name);
  }

  return {
    name: spec.name,
    label: spec.label,
    description: spec.description,
    subtype: spec.subtype,
    organization: spec.organization ?? 'Pega',
    library: spec.library ?? 'Extensions',
    version: spec.version ?? '4.0.4',
    properties,
    inputSettings: spec.inputSettings ?? ['placeholder', 'helperText'],
    capabilities: spec.capabilities ?? [],
    componentKey: `Pega_Extensions_${spec.name}`,
    componentName: `PegaExtensions${spec.name}`,
  };
};
