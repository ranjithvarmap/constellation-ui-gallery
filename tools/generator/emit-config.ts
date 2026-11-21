/**
 * Emits config.json from a spec, reproducing the property-panel conventions
 * the existing 55 components share (all 55 carry the About block; 26 carry the
 * Conditions group) from the builders in blocks.ts, rather than retyping them.
 */
import type { ResolvedFieldSpec } from './define';
import { p } from './blocks';

const ICONS: Record<string, string | undefined> = {
  Boolean: 'images/pz-checkbox-active.svg',
  Date: 'images/pz-text-input-active.svg',
  Integer: 'images/pz-integer-active.svg',
  'Text-URL': 'images/pz-url-active.svg',
};

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

/** Re-exported for the template and widget emitters, which end on the same block. */
export const aboutBlock = p.about;

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
      ...p.label(),
      ...authored,
      { name: 'readOnly', label: 'Edit mode', format: 'READONLY' },
      ...inputSettingsGroup(spec.inputSettings),
      p.conditions('editable'),
      p.advanced(),
      ...aboutBlock(spec, builtOn),
    ],
    defaultConfig: { label: '@L $this.label', detailFVLItem: true },
  };

  return `${JSON.stringify(config, null, 4)}\n`;
};
