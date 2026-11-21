import { defineField, p } from '../define';

/**
 * Example spec. Generate with:
 *   npm run generate -- tools/generator/specs/policy-reference.spec.ts
 */
export default defineField({
  name: 'PolicyReference',
  label: 'Policy reference',
  description: 'Displays and captures a policy reference number with a configurable prefix.',
  subtype: 'Text',
  properties: [
    p.text('prefix', 'Reference prefix', { defaultValue: 'POL-' }),
    p.select(
      'casing',
      'Casing',
      [
        { key: 'upper', value: 'Uppercase' },
        { key: 'preserve', value: 'Preserve as typed' },
      ],
      { defaultValue: 'upper' },
    ),
    p.boolean('showPrefixHint', 'Show prefix hint', { defaultValue: true }),
  ],
});
