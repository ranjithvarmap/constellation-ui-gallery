import { defineTemplate, r } from '../define';

/**
 * Example template spec. Generate with:
 *   npm run generate -- tools/generator/specs/two-column-summary.template.ts
 */
export default defineTemplate({
  name: 'TwoColumnSummary',
  label: 'Two column summary',
  description: 'Summary on the left, contacts on the right.',
  subtype: 'DETAILS',
  regions: [r.region('A', 'Summary'), r.region('B', 'Contacts')],
});
