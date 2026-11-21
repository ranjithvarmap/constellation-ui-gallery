import fs from 'fs';
import path from 'path';
import { p, type ConditionsMode, type PanelEntry } from './blocks';

const COMPONENTS = path.resolve(__dirname, '../../src/components');

const configs = fs
  .readdirSync(COMPONENTS)
  .filter((name) => fs.existsSync(path.join(COMPONENTS, name, 'config.json')))
  .map((name) => ({ name, config: JSON.parse(fs.readFileSync(path.join(COMPONENTS, name, 'config.json'), 'utf8')) }));

/** Top-level panel entries and those nested one GROUP deep, where the blocks live. */
const entries = (config: any): PanelEntry[] => config.properties ?? [];
const group = (config: any, label: string) =>
  entries(config).filter((entry) => entry.format === 'GROUP' && entry.label === label);

const MODES: ConditionsMode[] = ['visibility', 'editable', 'formOnly'];

describe('repeated config.json blocks match the builders', () => {
  it('reads every component', () => {
    expect(configs.length).toBeGreaterThan(50);
  });

  it.each(configs.map(({ name, config }) => [name, config]))(
    '%s: its Conditions group is one of p.conditions()',
    (_, config) => {
      for (const conditions of group(config, 'Conditions')) {
        const matches = MODES.filter((mode) => JSON.stringify(p.conditions(mode)) === JSON.stringify(conditions));
        expect({ conditions, matches: matches.length }).toEqual({ conditions, matches: 1 });
      }
    },
  );

  it.each(configs.map(({ name, config }) => [name, config]))(
    '%s: its Advanced group is p.advanced(), with any extra settings after Test ID',
    (_, config) => {
      for (const advanced of group(config, 'Advanced')) {
        const extra = ((advanced.properties as PanelEntry[]) ?? []).slice(1);
        expect(advanced).toEqual(p.advanced(...extra));
      }
    },
  );

  it.each(configs.map(({ name, config }) => [name, config]))('%s: it ends with p.about()', (_, config) => {
    const [aboutLabel, aboutData] = p.about({ organization: 'Org', library: 'Lib', version: '0' });
    const tail = entries(config).slice(-2);

    expect(tail[0]).toEqual(aboutLabel);
    /* The build writes the date and Infinity version into the label; the rest is fixed. */
    expect({ ...tail[1], label: undefined }).toEqual({ ...aboutData, label: undefined });
    expect(tail[1].label).toMatch(new RegExp(`^${config.organization}_${config.library} ${config.version}, `));
  });

  it('a hand edit to a block no longer matches', () => {
    const edited = p.conditions('editable') as { properties: PanelEntry[] };
    edited.properties[0] = { ...edited.properties[0], label: 'Mandatory' };

    expect(MODES.some((mode) => JSON.stringify(p.conditions(mode)) === JSON.stringify(edited))).toBe(false);
  });
});
