/**
 * Builders for the property-panel blocks every gallery component repeats in its
 * config.json: the label pair, the Conditions and Advanced groups, and the
 * About block.
 *
 * Pega reads config.json as plain JSON, so a hand-written file cannot call these.
 * They are the single definition instead: the generator emits from them, and
 * `blocks.test.ts` checks that every existing config.json's copy of a block is
 * exactly what one of these returns, so a block edited by hand in one file fails
 * the build instead of drifting quietly.
 */

/** A property-panel entry, as config.json holds it. */
export type PanelEntry = Record<string, unknown>;

/** The Conditions group's three shapes, found across the gallery's 26 copies. */
export type ConditionsMode =
  /** Visibility only: widgets and display fields, which have nothing to require or disable. */
  | 'visibility'
  /** Required and Disabled too, hidden when the field is read-only. */
  | 'editable'
  /**
   * Required and Disabled only where an editable control can appear: a form, an
   * embedded multi-record list, or a search view. Toggle uses it.
   */
  | 'formOnly';

const WHEN_EDITABLE = '(!readOnly = true)';
const WHEN_EDITABLE_ON_A_FORM =
  "!($this.readOnly == true) && (@VIEWTEMPLATESUBTYPE == 'FORM' || @ISINEMBEDDEDDATAMULTI == true || @RULEVIEWTYPE == 'search')";

const visibilityProperty = (): PanelEntry => ({ name: 'visibility', label: 'Visibility', format: 'VISIBILITY' });

/** The standard Test ID setting, always first in the Advanced group. */
const testIdProperty = (): PanelEntry => ({
  name: 'testId',
  label: 'Test ID',
  format: 'TEXT',
  ignorePattern: '[^-_\\p{N}\\p{L}]',
  includeAnnotations: false,
});

export const p = {
  /** The label pair every field carries; the platform resolves it through `defaultConfig.label`. */
  label: (): PanelEntry[] => [
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
  ],

  /** The Conditions group. */
  conditions: (mode: ConditionsMode = 'visibility'): PanelEntry => {
    if (mode === 'visibility') {
      return { label: 'Conditions', format: 'GROUP', properties: [visibilityProperty()] };
    }
    const when = mode === 'formOnly' ? WHEN_EDITABLE_ON_A_FORM : WHEN_EDITABLE;
    return {
      label: 'Conditions',
      format: 'GROUP',
      properties: [
        { name: 'required', label: 'Required', format: 'REQUIRED', visibility: when },
        { name: 'disabled', label: 'Disabled', format: 'DISABLED', visibility: when },
        visibilityProperty(),
      ],
    };
  },

  /** The collapsible Advanced group: Test ID, then any component-specific settings. */
  advanced: (...extra: PanelEntry[]): PanelEntry => ({
    label: 'Advanced',
    format: 'GROUP',
    collapsible: true,
    properties: [testIdProperty(), ...extra],
  }),

  /**
   * The About block every gallery component ends its panel with. The build
   * appends the Infinity version to the second label, so only the part before
   * that is fixed here.
   */
  about: (
    spec: { organization: string; library: string; version: string },
    builtOn: Date = new Date(),
  ): PanelEntry[] => [
    { format: 'LABEL', label: 'About', name: 'PegaAboutLabel', variant: 'h3' },
    {
      format: 'LABEL',
      label: `${spec.organization}_${spec.library} ${spec.version}, ${builtOn.toDateString()}`,
      name: 'PegaAboutData',
      variant: 'primary',
    },
  ],
};
