import { defineField, defineTemplate, defineWidget, p, r } from './define';
import { describePlan, todosIn } from './plan';
import { renderComponent } from './render';

const plan = (spec: Parameters<typeof describePlan>[0], exists = false) =>
  describePlan(spec, renderComponent(spec), exists);

test('a field: its subtype, settings with choices and defaults, and what is left to write', () => {
  const text = plan(
    defineField({
      name: 'PolicyReference',
      label: 'Policy reference',
      description: 'Captures a policy reference.',
      subtype: 'Text',
      properties: [
        p.text('prefix', 'Reference prefix', { defaultValue: 'POL-' }),
        p.select('casing', 'Casing', [
          { key: 'upper', value: 'Upper' },
          { key: 'preserve', value: 'Preserve' },
        ]),
      ],
    }),
  );

  expect(text).toContain('Pega_Extensions_PolicyReference — Field, Text');
  expect(text).toContain('  - prefix — "Reference prefix" (TEXT; default: "POL-")');
  expect(text).toContain('  - casing — "Casing" (SELECT; choices: upper, preserve)');
  /* Authored properties are typed but not read until someone implements them. */
  expect(text).toMatch(/Left for you to write \(1\):\n {2}- index\.tsx:\d+: TODO: wire up the authored properties/);
});

test('a template: its layout and each region', () => {
  const text = plan(
    defineTemplate({
      name: 'TwoColumnSummary',
      label: 'Two column summary',
      description: 'Two regions.',
      subtype: 'FORM',
      regions: [
        r.region('A', 'Summary'),
        r.region('B', 'Contacts', { accepts: ['Widgets'], allowCreatingGroup: true }),
      ],
    }),
  );

  expect(text).toContain('Editable form layout with 2 region(s):');
  expect(text).toContain('  - B — "Contacts" (accepts Widgets; groups allowed)');
  expect(text).toContain('Left for you to write: nothing; it works as generated.');
});

test('a widget: where it goes, its columns and the case parameter', () => {
  const text = plan(
    defineWidget({
      name: 'RelatedTasks',
      label: 'Related tasks',
      description: 'Tasks on this case.',
      subtype: ['PAGE', 'CASE'],
      list: { columns: [{ field: 'pyLabel', label: 'Task' }], caseParameter: 'CaseInstanceKey' },
    }),
  );

  expect(text).toContain('Pega_Extensions_RelatedTasks — Widget, PAGE and CASE');
  expect(text).toContain('  - pyLabel — "Task"');
  expect(text).toContain('The case key is passed as the data page parameter "CaseInstanceKey".');
});

test('warns when the folder exists, since generating would need --force', () => {
  const spec = defineWidget({ name: 'Card', label: 'Card', description: 'A card.', subtype: 'PAGE' });
  expect(plan(spec, true)).toContain('The folder already exists: generating needs --force');
  expect(plan(spec)).not.toContain('already exists');
});

test('a TODO that runs on to the next line is marked as cut', () => {
  expect(
    todosIn([{ name: 'a.tsx', contents: 'x\n  // TODO: finish this.\n  /* TODO: wire the props, they are typed,\n' }]),
  ).toEqual(['a.tsx:2: TODO: finish this.', 'a.tsx:3: TODO: wire the props, they are typed…']);
});
