import { defineField } from '../define';

/**
 * A dropdown whose values come from the Pega property's value list.
 *
 * The four choices are NOT declared here on purpose: they live on the property
 * (a local list, or a data page), so an App Studio author can change them
 * without regenerating or republishing this component.
 *
 * Generate with:
 *   npm run generate -- tools/generator/specs/coverage-level.field.ts
 */
export default defineField({
  name: 'CoverageLevel',
  label: 'Coverage level',
  description: 'Dropdown for selecting a policy coverage level from the property value list.',
  subtype: 'Picklist',
});
