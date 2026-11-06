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

/** What every kind of spec shares, before validation. */
type BaseSpec = {
  /** Bare name; the component key becomes `Pega_Extensions_<name>`. */
  name: string;
  /** Label shown in App Studio. */
  label: string;
  description: string;
  /** Authored properties, beyond the standard set for the kind. */
  properties?: PropertySpec[];
  organization?: string;
  library?: string;
  version?: string;
};

/** What every resolved spec carries, whatever its kind. */
export type ResolvedBase = Required<Omit<BaseSpec, 'properties'>> & {
  properties: PropertySpec[];
  /** `Pega_Extensions_Foo` — the folder name and componentKey. */
  componentKey: string;
  /** `PegaExtensionsFoo` — the exported React component name. */
  componentName: string;
};

export type ResolvedFieldSpec = ResolvedBase & {
  kind: 'Field';
  subtype: FieldSubtype;
  inputSettings: InputSetting[];
  capabilities: Capability[];
};

/** What a template region may hold, as App Studio's content picker names it. */
export type RegionContent = 'Fields' | 'Views' | 'Widgets' | 'Insights';

/** One region: a CONTENTPICKER in config.json, one element of `children` at runtime. */
export type RegionSpec = {
  /** e.g. `A`. Regions are named, not props, so PascalCase like the gallery's. */
  name: string;
  label: string;
  accepts: RegionContent[];
  allowCreatingGroup: boolean;
};

/** Builders for template regions. */
export const r = {
  region: (
    name: string,
    label: string,
    options: { accepts?: RegionContent[]; allowCreatingGroup?: boolean } = {},
  ): RegionSpec => ({
    name,
    label,
    accepts: options.accepts ?? ['Fields', 'Views'],
    allowCreatingGroup: options.allowCreatingGroup ?? false,
  }),
};

export type TemplateSubtype = 'FORM' | 'DETAILS';

export type TemplateSpec = BaseSpec & {
  /** FORM lays out editable content; DETAILS renders its regions read-only. */
  subtype: TemplateSubtype;
  /** Defaults to a single region `A`, as 11 of the gallery's 13 templates have. */
  regions?: RegionSpec[];
};

export type ResolvedTemplateSpec = ResolvedBase & {
  kind: 'Template';
  subtype: TemplateSubtype;
  regions: RegionSpec[];
};

/** Where a widget may be placed. config.json writes the pair as an array. */
export type WidgetSubtype = 'CASE' | 'PAGE' | ['PAGE', 'CASE'];

/** One column of a widget's list: a field of each data page row. */
export type ListColumn = { field: string; label: string };

/** A list read from a data page the author names in App Studio. */
export type WidgetListSpec = {
  columns: ListColumn[];
  /**
   * Data page parameter that receives the case key, e.g. `CaseInstanceKey`.
   * Omit for a list that does not depend on the case.
   */
  caseParameter?: string;
};

export type WidgetSpec = BaseSpec & {
  subtype: WidgetSubtype;
  /** A data page list with loading, empty and error states. Omit for a bare card. */
  list?: WidgetListSpec;
};

export type ResolvedWidgetSpec = ResolvedBase & {
  kind: 'Widget';
  subtype: WidgetSubtype;
  list?: WidgetListSpec;
};

export type ResolvedSpec = ResolvedFieldSpec | ResolvedTemplateSpec | ResolvedWidgetSpec;

const PASCAL = /^[A-Z][A-Za-z0-9]*$/;
const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * The checks every kind shares: a PascalCase name, and camelCase, unique
 * authored properties that do not collide with the props the kind emits itself.
 */
const resolveBase = (spec: BaseSpec, reserved: Set<string>, kind: string): ResolvedBase => {
  if (!PASCAL.test(spec.name)) {
    throw new Error(`name must be PascalCase with no separators, got "${spec.name}"`);
  }
  const properties = spec.properties ?? [];

  const seen = new Set<string>();
  for (const property of properties) {
    if (!/^[a-z][A-Za-z0-9]*$/.test(property.name)) {
      throw new Error(`property "${property.name}" must be camelCase`);
    }
    if (reserved.has(property.name)) {
      throw new Error(
        `property "${property.name}" collides with a standard ${kind} prop; the standard one is emitted for you`,
      );
    }
    if (seen.has(property.name)) throw new Error(`duplicate property "${property.name}"`);
    seen.add(property.name);
  }

  return {
    name: spec.name,
    label: spec.label,
    description: spec.description,
    organization: spec.organization ?? 'Pega',
    library: spec.library ?? 'Extensions',
    version: spec.version ?? '4.0.4',
    properties,
    componentKey: `Pega_Extensions_${spec.name}`,
    componentName: `PegaExtensions${spec.name}`,
  };
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
export const defineField = (spec: FieldSpec): ResolvedFieldSpec => {
  const base = resolveBase(spec, RESERVED, 'field');

  /* A checkbox has nowhere to show a placeholder, so offering one would put a
     control in the property panel that the component cannot honour. */
  if (spec.subtype === 'Boolean' && spec.inputSettings?.includes('placeholder')) {
    throw new Error('a Boolean field has no placeholder; remove it from inputSettings');
  }
  const defaultInputSettings: InputSetting[] =
    spec.subtype === 'Boolean' ? ['helperText'] : ['placeholder', 'helperText'];

  return {
    ...base,
    kind: 'Field',
    subtype: spec.subtype,
    inputSettings: spec.inputSettings ?? defaultInputSettings,
    capabilities: spec.capabilities ?? [],
  };
};

/** Props every generated template emits itself. */
const TEMPLATE_RESERVED = new Set([
  'heading',
  'NumCols',
  'children',
  'getPConnect',
  'label',
  'showLabel',
  'readOnly',
  'displayMode',
  'visibility',
]);

/**
 * Validate and normalise a template spec. Regions become CONTENTPICKER
 * entries in config.json and arrive as `children` at runtime, so their names
 * must be unique.
 */
export const defineTemplate = (spec: TemplateSpec): ResolvedTemplateSpec => {
  const base = resolveBase(spec, TEMPLATE_RESERVED, 'template');
  const regions = spec.regions ?? [r.region('A', 'Region A')];

  if (regions.length === 0) throw new Error('a template needs at least one region');
  const names = new Set<string>();
  for (const region of regions) {
    if (!PASCAL.test(region.name)) {
      throw new Error(`region "${region.name}" must be PascalCase, like the gallery's "A" or "Fields"`);
    }
    /* No clash with properties is possible: regions are PascalCase, properties camelCase. */
    if (names.has(region.name)) throw new Error(`duplicate region "${region.name}"`);
    if (region.accepts.length === 0) throw new Error(`region "${region.name}" accepts nothing`);
    names.add(region.name);
  }

  return { ...base, kind: 'Template', subtype: spec.subtype, regions };
};

/** Props every generated widget emits itself. */
const WIDGET_RESERVED = new Set(['heading', 'dataPage', 'getPConnect', 'visibility']);

/**
 * Validate and normalise a widget spec. A list's columns become Cosmos Table
 * renderers keyed by row field, so fields must be identifiers and unique.
 */
export const defineWidget = (spec: WidgetSpec): ResolvedWidgetSpec => {
  const base = resolveBase(spec, WIDGET_RESERVED, 'widget');
  const { list } = spec;

  if (list) {
    if (list.columns.length === 0) throw new Error('a widget list needs at least one column');
    const fields = new Set<string>();
    for (const column of list.columns) {
      if (!IDENTIFIER.test(column.field)) {
        throw new Error(`list column field "${column.field}" must be an identifier`);
      }
      /* Each row is given an `id` for the table, so a column cannot claim it. */
      if (column.field === 'id') throw new Error('list column field "id" is reserved for the row key');
      if (fields.has(column.field)) throw new Error(`duplicate list column "${column.field}"`);
      if (!column.label.trim()) throw new Error(`list column "${column.field}" needs a label`);
      fields.add(column.field);
    }
    if (list.caseParameter !== undefined) {
      if (!IDENTIFIER.test(list.caseParameter)) {
        throw new Error(`caseParameter "${list.caseParameter}" must be an identifier`);
      }
      /* A page has no case behind it, so there would be no key to pass. */
      if (spec.subtype === 'PAGE') {
        throw new Error('a PAGE-only widget has no case; drop caseParameter or place it on CASE');
      }
    }
  }

  return { ...base, kind: 'Widget', subtype: spec.subtype, ...(list ? { list } : {}) };
};
