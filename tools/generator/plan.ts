/**
 * A readable summary of what a spec will generate, without writing anything:
 * `npm run generate -- <spec> --plan`. It is the review step between a spec
 * (hand-written, or drafted from a screenshot) and the files on disk.
 */
import type { PropertySpec, ResolvedSpec } from './define';
import type { GeneratedFile } from './render';

const placement = (subtype: ResolvedSpec['subtype']) =>
  Array.isArray(subtype) ? subtype.join(' and ') : String(subtype);

const property = (prop: PropertySpec) => {
  const extra: string[] = [prop.format];
  const source = prop.config?.source;
  if (Array.isArray(source)) extra.push(`choices: ${source.map((choice: { key: string }) => choice.key).join(', ')}`);
  if (prop.config?.defaultValue !== undefined) extra.push(`default: ${JSON.stringify(prop.config.defaultValue)}`);
  return `  - ${prop.name} — "${prop.label}" (${extra.join('; ')})`;
};

/** Every `TODO` the generated files leave, as `file:line: text`, numbered as the files are given. */
export const todosIn = (files: GeneratedFile[]): string[] =>
  files.flatMap((file) =>
    file.contents.split('\n').flatMap((line, at) => {
      if (!/\bTODO\b/.test(line)) return [];
      const text = line.replace(/^\s*(\/\/|\/\*+|\*|\{\/\*)\s*/, '').replace(/\s*(\*\/\}?)$/, '');
      /* A TODO that runs on to the next line is cut, so say so. */
      return [`${file.name}:${at + 1}: ${/[.!?]$/.test(text) ? text : `${text.replace(/[,;:]$/, '')}…`}`];
    }),
  );

export const describePlan = (spec: ResolvedSpec, files: GeneratedFile[], exists: boolean): string => {
  const lines: string[] = [];
  lines.push(`${spec.componentKey} — ${spec.kind}, ${placement(spec.subtype)}`);
  lines.push(`  "${spec.label}": ${spec.description}`);
  lines.push('');

  if (spec.kind === 'Field') {
    lines.push(`Binds one ${spec.subtype} property.`);
    lines.push(`Input settings: ${spec.inputSettings.length ? spec.inputSettings.join(', ') : 'none'}`);
    lines.push(`Platform access: ${spec.capabilities.length ? spec.capabilities.join(', ') : 'none (presentational)'}`);
  } else if (spec.kind === 'Template') {
    lines.push(
      `${spec.subtype === 'FORM' ? 'Editable form' : 'Read-only details'} layout with ${spec.regions.length} region(s):`,
    );
    spec.regions.forEach((region) =>
      lines.push(
        `  - ${region.name} — "${region.label}" (accepts ${region.accepts.join(', ')}${region.allowCreatingGroup ? '; groups allowed' : ''})`,
      ),
    );
  } else if (spec.list) {
    lines.push(`List from a data page the author picks, columns:`);
    spec.list.columns.forEach((column) => lines.push(`  - ${column.field} — "${column.label}"`));
    lines.push(
      spec.list.caseParameter
        ? `The case key is passed as the data page parameter "${spec.list.caseParameter}".`
        : 'The list does not depend on the case.',
    );
  } else {
    lines.push('A bare card; its content is yours to write.');
  }

  lines.push('');
  lines.push(spec.properties.length ? 'Settings in App Studio:' : 'Settings in App Studio: only the standard ones.');
  spec.properties.forEach((prop) => lines.push(property(prop)));

  lines.push('');
  lines.push(`Files (src/components/${spec.componentKey}/): ${files.map((file) => file.name).join(', ')}`);
  if (exists) lines.push('  The folder already exists: generating needs --force, which overwrites it.');

  const todos = todosIn(files);
  lines.push('');
  lines.push(
    todos.length
      ? `Left for you to write (${todos.length}):`
      : 'Left for you to write: nothing; it works as generated.',
  );
  todos.forEach((todo) => lines.push(`  - ${todo}`));
  return lines.join('\n');
};
