import { defineField, p } from './define';
import { renderComponent } from './render';
import { declaredInConfig } from '../config-parity/parity';

const spec = defineField({
  name: 'SampleField',
  label: 'Sample field',
  description: 'A field used to exercise the generator.',
  subtype: 'Text',
  properties: [
    p.text('prefix', 'Prefix', { defaultValue: 'X-' }),
    p.select('casing', 'Casing', [
      { key: 'upper', value: 'Upper' },
      { key: 'lower', value: 'Lower' },
    ]),
  ],
});

const fileMap = () => {
  const files = renderComponent(spec, new Date('2026-09-06T00:00:00Z'));
  return Object.fromEntries(files.map((file) => [file.name, file.contents]));
};

describe('spec validation', () => {
  it('rejects a property that collides with a standard field prop', () => {
    expect(() =>
      defineField({
        name: 'Bad',
        label: 'Bad',
        description: '',
        subtype: 'Text',
        properties: [p.text('testId', 'Test id')],
      }),
    ).toThrow(/collides with a standard field prop/);
  });

  it('rejects a name that is not PascalCase', () => {
    expect(() =>
      defineField({ name: 'bad name', label: 'x', description: '', subtype: 'Text' }),
    ).toThrow(/PascalCase/);
  });

  it('rejects duplicate properties', () => {
    expect(() =>
      defineField({
        name: 'Dupe',
        label: 'x',
        description: '',
        subtype: 'Text',
        properties: [p.text('a', 'A'), p.text('a', 'A again')],
      }),
    ).toThrow(/duplicate property/);
  });
});

describe('generated output', () => {
  it('emits the six component files', () => {
    const files = fileMap();
    expect(Object.keys(files).sort()).toEqual([
      'Docs.mdx',
      'config.json',
      'demo.stories.tsx',
      'demo.test.tsx',
      'index.tsx',
      'styles.ts',
    ]);
  });

  /**
   * The guarantee the whole spec design exists for: every property the
   * property panel offers is a prop the component accepts. This is the same
   * rule tools/config-parity enforces against the existing components, applied
   * to generated output before it ever reaches disk.
   */
  it('declares every config.json property on the props type', () => {
    const files = fileMap();
    const config = JSON.parse(files['config.json']);
    const match = /type \w+Props = \{([\s\S]*?)\n\};/.exec(files['index.tsx']);
    expect(match).not.toBeNull();
    const propsBlock = match![1];

    for (const property of declaredInConfig(config)) {
      expect(propsBlock).toContain(`${property.name}`);
    }
  });

  it('carries the authored properties into both config.json and the props type', () => {
    const files = fileMap();
    const config = JSON.parse(files['config.json']);
    const names = declaredInConfig(config).map((property) => property.name);

    expect(names).toEqual(expect.arrayContaining(['prefix', 'casing']));
    expect(files['index.tsx']).toContain("casing?: 'upper' | 'lower';");
    expect(files['index.tsx']).toContain('prefix?: string;');
  });

  it('does not destructure authored properties it cannot wire up', async () => {
    /* Destructuring them unused would emit exactly the dead-knob defect this
       tooling exists to prevent, and would fail lint. */
    const files = fileMap();
    expect(files['index.tsx']).toContain('TODO: wire up the authored properties');
    expect(files['index.tsx']).not.toMatch(/const \{[^}]*\bprefix\b/s);
  });

  it('reproduces the standard property-panel groups', () => {
    const files = fileMap();
    const config = JSON.parse(files['config.json']);
    const groups = config.properties.filter((property: any) => property.format === 'GROUP');

    expect(groups.map((group: any) => group.label)).toEqual(['Input settings', 'Conditions', 'Advanced']);
    expect(config.properties.some((property: any) => property.name === 'PegaAboutLabel')).toBe(true);
    expect(config.defaultConfig).toEqual({ label: '@L $this.label', detailFVLItem: true });
  });

  it('uses the shared platform fake in the generated story', () => {
    const files = fileMap();
    expect(files['demo.stories.tsx']).toContain('installPlatformFake');
  });
});
