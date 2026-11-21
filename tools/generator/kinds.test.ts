/**
 * Templates and Widgets: spec validation and the shape of what is emitted.
 *
 * The conventions asserted here come from two sources: Pega's own scaffolding
 * in @pega/custom-dx-components (templates/Constellation/Template and Widget),
 * and the gallery's existing components (11 of 13 templates have one region
 * `A`; 14 of 17 widgets have `heading`, 11 a `dataPage`).
 */
import { defineTemplate, defineWidget, p, r, type ResolvedSpec } from './define';
import { renderComponent } from './render';
import { declaredInConfig } from '../config-parity/parity';

const filesOf = (spec: ResolvedSpec) =>
  Object.fromEntries(renderComponent(spec, new Date('2026-11-06T00:00:00Z')).map((file) => [file.name, file.contents]));

const configOf = (spec: ResolvedSpec) => JSON.parse(filesOf(spec)['config.json']);

const template = (overrides: Partial<Parameters<typeof defineTemplate>[0]> = {}) =>
  defineTemplate({ name: 'Layout', label: 'Layout', description: 'A layout.', subtype: 'FORM', ...overrides });

const widget = (overrides: Partial<Parameters<typeof defineWidget>[0]> = {}) =>
  defineWidget({ name: 'Panel', label: 'Panel', description: 'A panel.', subtype: 'CASE', ...overrides });

const list = { columns: [{ field: 'pyLabel', label: 'Name' }], caseParameter: 'CaseInstanceKey' };

describe('template specs', () => {
  it('defaults to a single region A that accepts fields and views', () => {
    expect(template().regions).toEqual([
      { name: 'A', label: 'Region A', accepts: ['Fields', 'Views'], allowCreatingGroup: false },
    ]);
  });

  it.each([
    ['no regions', { regions: [] }, /at least one region/],
    ['a region that is not PascalCase', { regions: [r.region('left', 'Left')] }, /must be PascalCase/],
    ['duplicate regions', { regions: [r.region('A', 'One'), r.region('A', 'Two')] }, /duplicate region "A"/],
    ['a region that accepts nothing', { regions: [r.region('A', 'A', { accepts: [] })] }, /accepts nothing/],
    [
      'a property that shadows a standard prop',
      { properties: [p.text('heading', 'Heading')] },
      /standard template prop/,
    ],
  ])('rejects %s', (_, overrides, error) => {
    expect(() => template(overrides as never)).toThrow(error);
  });

  it('emits each region as a content picker, in order, and never as a prop', () => {
    const config = configOf(
      template({
        regions: [r.region('A', 'Left'), r.region('B', 'Right', { accepts: ['Fields'], allowCreatingGroup: true })],
      }),
    );
    const pickers = config.properties.filter((property: any) => property.format === 'CONTENTPICKER');

    expect(pickers).toEqual([
      { name: 'A', label: 'Left', format: 'CONTENTPICKER', addTypeList: ['Fields', 'Views'] },
      { name: 'B', label: 'Right', format: 'CONTENTPICKER', addTypeList: ['Fields'], allowCreatingGroup: true },
    ]);
    /* config-parity skips CONTENTPICKER: a region arrives as children, not a prop. */
    expect(declaredInConfig(config).map((property) => property.name)).not.toContain('A');
  });

  it('offers a column count only when there is one region to lay out', () => {
    const names = (spec: ResolvedSpec) => configOf(spec).properties.map((property: any) => property.name);

    expect(names(template())).toContain('NumCols');
    expect(names(template({ regions: [r.region('A', 'A'), r.region('B', 'B')] }))).not.toContain('NumCols');
  });

  it('normalises children, so one region passed as a single element still renders', () => {
    expect(filesOf(template())['index.tsx']).toContain('const regions = Children.toArray(children);');
    expect(filesOf(template())['index.tsx']).not.toContain('children.map');
  });

  it('marks regions read-only for DETAILS, and only for DETAILS', () => {
    const details = filesOf(template({ subtype: 'DETAILS' }));
    const form = filesOf(template());

    expect(details['index.tsx']).toContain("pConn.setInheritedProp('readOnly', true);");
    expect(details['index.tsx']).toContain('regions.forEach(showReadOnly);');
    expect(details['demo.test.tsx']).toContain('shows every region read-only');
    expect(form['index.tsx']).not.toContain('showReadOnly');
    /* The region fixture is only emitted where a test uses it. */
    expect(form['demo.test.tsx']).not.toContain('createFakeGetPConnect');
  });

  it('declares every property the panel offers on the props type', () => {
    const files = filesOf(template({ properties: [p.boolean('dense', 'Dense')] }));
    const props = /export type \w+Props = \{([\s\S]*?)\n\};/.exec(files['index.tsx'])![1];

    for (const property of declaredInConfig(JSON.parse(files['config.json']))) {
      expect(props).toContain(`${property.name}?:`);
    }
  });
});

describe('widget specs', () => {
  it.each([
    ['a list with no columns', { list: { columns: [] } }, /at least one column/],
    [
      'a column field that is not an identifier',
      { list: { columns: [{ field: 'py Label', label: 'x' }] } },
      /identifier/,
    ],
    ['a column named id', { list: { columns: [{ field: 'id', label: 'Id' }] } }, /reserved for the row key/],
    [
      'duplicate columns',
      {
        list: {
          columns: [
            { field: 'a', label: 'A' },
            { field: 'a', label: 'B' },
          ],
        },
      },
      /duplicate list column/,
    ],
    ['a column without a label', { list: { columns: [{ field: 'a', label: ' ' }] } }, /needs a label/],
    ['a case parameter on a page-only widget', { subtype: 'PAGE', list }, /PAGE-only widget has no case/],
    [
      'a property that shadows a standard prop',
      { properties: [p.text('dataPage', 'Data page')] },
      /standard widget prop/,
    ],
  ])('rejects %s', (_, overrides, error) => {
    expect(() => widget(overrides as never)).toThrow(error);
  });

  it('allows a case parameter wherever a case can be', () => {
    expect(() => widget({ subtype: ['PAGE', 'CASE'], list })).not.toThrow();
  });

  it('writes the placement as config.json does: a string, or the pair as an array', () => {
    expect(configOf(widget()).subtype).toBe('CASE');
    expect(configOf(widget({ subtype: ['PAGE', 'CASE'] })).subtype).toEqual(['PAGE', 'CASE']);
  });

  it('gives every widget a heading, defaulted to its label, and a visibility condition', () => {
    const config = configOf(widget());

    expect(config.properties[0]).toEqual({ name: 'heading', label: 'Heading', format: 'TEXT' });
    expect(config.defaultConfig).toEqual({ heading: '@L Panel' });
    expect(config.properties.find((property: any) => property.label === 'Conditions')).toEqual({
      label: 'Conditions',
      format: 'GROUP',
      properties: [{ name: 'visibility', label: 'Visibility', format: 'VISIBILITY' }],
    });
  });

  it('asks for a data page, required, only when there is a list', () => {
    const dataPage = (spec: ResolvedSpec) =>
      declaredInConfig(configOf(spec)).find((property) => property.name === 'dataPage');

    expect(dataPage(widget({ list }))).toEqual({ name: 'dataPage', format: 'TEXT' });
    expect(
      configOf(widget({ list })).properties.find((property: any) => property.label === 'Data source').properties[0]
        .required,
    ).toBe(true);
    expect(dataPage(widget())).toBeUndefined();
  });

  it('reads the list through the facade, keyed by the case only when asked', () => {
    expect(filesOf(widget({ list }))['index.tsx']).toContain(
      'platform.caseData.query(dataPage, { dataViewParameters: { CaseInstanceKey: platform.caseInfo.key() } })',
    );
    expect(filesOf(widget({ list: { columns: list.columns } }))['index.tsx']).toContain(
      'platform.caseData.query(dataPage)',
    );
    expect(filesOf(widget({ list }))['index.tsx']).not.toContain('PCore');
  });

  it('refreshes after a submission and hands back the unsubscribe', () => {
    expect(filesOf(widget({ list }))['index.tsx']).toContain(
      "return createPlatform(getPConnect).events.on('assignmentSubmission', load);",
    );
  });

  it('localizes the column labels and the states it shows', () => {
    const files = filesOf(widget({ list }));

    expect(JSON.parse(files['localizations.json'])).toEqual({
      fields: { Name: 'Name', 'No items': 'No items', 'Unable to load the list': 'Unable to load the list' },
    });
    expect(files['index.tsx']).toContain("label: t('Name')");
  });

  it('emits a bare card, with no data page or localizations, when there is no list', () => {
    const files = filesOf(widget({ subtype: 'PAGE' }));

    expect(Object.keys(files)).not.toContain('localizations.json');
    expect(files['index.tsx']).not.toContain('dataPage');
    /* Cosmos CardContent requires children; a JSX comment is not one. */
    expect(files['index.tsx']).toContain('<CardContent>{content}</CardContent>');
  });

  it('covers loading, empty, failed and unmount in the emitted tests', () => {
    const test = filesOf(widget({ list }))['demo.test.tsx'];

    for (const name of [
      'lists the rows',
      'keyed by the case',
      'returns nothing',
      'cannot be read',
      'stops listening',
    ]) {
      expect(test).toContain(name);
    }
  });
});
