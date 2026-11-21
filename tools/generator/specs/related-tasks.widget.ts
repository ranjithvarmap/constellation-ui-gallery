import { defineWidget } from '../define';

/**
 * Example widget spec. Generate with:
 *   npm run generate -- tools/generator/specs/related-tasks.widget.ts
 */
export default defineWidget({
  name: 'RelatedTasks',
  label: 'Related tasks',
  description: 'Tasks raised against this case.',
  subtype: 'CASE',
  list: { columns: [{ field: 'pyLabel', label: 'Task' }], caseParameter: 'CaseInstanceKey' },
});
