import fs from 'fs';
import path from 'path';
import { checkParity, declaredInConfig, type ParityReport } from './parity';

const ROOT = path.resolve(__dirname, '../..');
const COMPONENTS = path.join(ROOT, 'src/components');
const BASELINE = path.join(__dirname, 'known-drift.json');

describe('config.json / component props parity', () => {
  let report: ParityReport;
  let baseline: string[];

  beforeAll(() => {
    report = checkParity(COMPONENTS, path.join(ROOT, 'tsconfig.json'));
    baseline = JSON.parse(fs.readFileSync(BASELINE, 'utf8')).drift;
  });

  it('locates the component function in every component', () => {
    expect(report.unresolved).toEqual([]);
    expect(report.checked.length).toBeGreaterThan(50);
  });

  it('exposes no property in Designer that the component ignores', () => {
    const found = report.violations.map((v) => v.id).sort();
    const isNew = found.filter((id) => !baseline.includes(id));

    /* Anything new means a property panel knob was just added, renamed or
       orphaned without the component being wired to read it. */
    expect(isNew).toEqual([]);
  });

  it('has no stale entries in the known-drift baseline', () => {
    const found = report.violations.map((v) => v.id);
    const fixed = baseline.filter((id) => !found.includes(id));

    /* Keeps the baseline shrinking: once drift is fixed, its entry must be
       removed, so the list cannot quietly become a permanent allowlist. */
    expect(fixed).toEqual([]);
  });
});

describe('platform-read settings', () => {
  const group = (label: string, names: string[]) => ({
    label,
    format: 'GROUP',
    properties: names.map((name) => ({ name, label: name, format: 'TEXT' })),
  });

  it("skips a table column's width settings, which the platform's table reads", () => {
    const config = { properties: [group('Column settings', ['columnWidth', 'width'])] };
    expect(declaredInConfig(config)).toEqual([]);
  });

  it('still checks the same names anywhere else, and other names in that group', () => {
    const config = {
      properties: [
        { name: 'width', label: 'Width', format: 'TEXT' },
        group('Column settings', ['columnWidth', 'padding']),
      ],
    };
    expect(declaredInConfig(config).map((property) => property.name)).toEqual(['width', 'padding']);
  });
});
