/**
 * Checks that every property a component exposes in `config.json` is actually
 * consumed by the component.
 *
 * App Studio renders the `properties` array in config.json as the component's
 * property panel. Nothing verifies those names against the component's code,
 * so a knob can be removed from (or never wired into) the TSX and keep showing
 * up in Designer, where setting it silently does nothing. That drift is the
 * bug class this catches.
 */
import fs from 'fs';
import path from 'path';
import ts from 'typescript';

export type Violation = {
  component: string;
  property: string;
  format: string;
  /** "Component.property", the stable id used in the known-drift baseline. */
  id: string;
};

/**
 * Formats the platform consumes itself. These are authored in config.json but
 * are never handed to the component as props:
 *  - GROUP / LABEL structure the property panel.
 *  - VISIBILITY is evaluated by the platform around the component.
 *  - CONTENTPICKER names a region, delivered as children rather than a prop.
 *  - CASELINK is resolved into a case link by the platform.
 */
const NON_PROP_FORMATS = new Set(['GROUP', 'LABEL', 'VISIBILITY', 'CONTENTPICKER', 'CASELINK']);

/**
 * Names the platform resolves before the component sees them.
 *
 * `labelOption` selects between the default and a custom label; the platform
 * applies it through `defaultConfig.label` ("@L $this.label") and the component
 * only ever receives the resolved `label`. It is declared in 20 config.json
 * files and referenced in zero runtime files, which is what makes it a
 * convention rather than 20 defects.
 */
const PLATFORM_RESOLVED = new Set(['labelOption']);

/**
 * Table column settings, which the platform's table reads to size a field's
 * column when the field is shown in an embedded list; the field never sees
 * them. Pega's own Field scaffolding (@pega/custom-dx-components) declares
 * both in 15 of its 18 field types, inside a "Column settings" group visible
 * only in a table view, and none of its components reads either. Only these
 * names, and only inside that group, are skipped.
 */
const COLUMN_SETTINGS_GROUP = 'Column settings';
const COLUMN_SETTINGS = new Set(['columnWidth', 'width']);

const COMPONENT_NAME = /^(Pega|Rohan)/;

/** Property names declared in config.json, flattened through GROUP nesting. */
export const declaredInConfig = (config: any): { name: string; format: string }[] => {
  const out: { name: string; format: string }[] = [];
  const walk = (properties: any[] | undefined, group?: string) => {
    for (const property of properties ?? []) {
      if (Array.isArray(property.properties)) walk(property.properties, property.label);
      if (!property.name) continue;
      if (NON_PROP_FORMATS.has(property.format)) continue;
      if (PLATFORM_RESOLVED.has(property.name)) continue;
      if (group === COLUMN_SETTINGS_GROUP && COLUMN_SETTINGS.has(property.name)) continue;
      out.push({ name: property.name, format: property.format ?? 'unknown' });
    }
  };
  walk(config.properties);
  return out;
};

/**
 * Locate the component function in a source file: the identifier handed to
 * `withConfiguration()` in the default export, falling back to an exported
 * function whose name looks like a component.
 */
const findComponent = (source: ts.SourceFile, checker: ts.TypeChecker): ts.SignatureDeclaration | null => {
  let target: ts.Identifier | null = null;
  const findExport = (node: ts.Node): void => {
    if (ts.isExportAssignment(node) && ts.isCallExpression(node.expression)) {
      const [arg] = node.expression.arguments;
      if (arg && ts.isIdentifier(arg)) target = arg;
    }
    ts.forEachChild(node, findExport);
  };
  findExport(source);

  if (target) {
    const symbol = checker.getSymbolAtLocation(target);
    let declaration = symbol?.declarations?.[0] as ts.Node | undefined;
    if (declaration && ts.isVariableDeclaration(declaration) && declaration.initializer) {
      declaration = declaration.initializer;
    }
    if (declaration && (ts.isArrowFunction(declaration) || ts.isFunctionDeclaration(declaration))) {
      return declaration;
    }
  }

  let fallback: ts.SignatureDeclaration | null = null;
  const findNamed = (node: ts.Node): void => {
    if (fallback) return;
    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (
          COMPONENT_NAME.test(declaration.name.getText()) &&
          declaration.initializer &&
          ts.isArrowFunction(declaration.initializer)
        ) {
          fallback = declaration.initializer;
        }
      }
    }
    if (ts.isFunctionDeclaration(node) && node.name && COMPONENT_NAME.test(node.name.getText())) {
      fallback = node;
    }
    ts.forEachChild(node, findNamed);
  };
  findNamed(source);
  return fallback;
};

/** Runtime sources for a component, excluding tests, stories and their fixtures. */
const runtimeSource = (dir: string): string =>
  fs
    .readdirSync(dir)
    .filter((file) => /\.(ts|tsx)$/.test(file) && !/\.(test|stories|fixtures)\./.test(file))
    .map((file) => fs.readFileSync(path.join(dir, file), 'utf8'))
    .join('\n');

export type ParityReport = {
  checked: string[];
  /** Components whose function signature could not be located. */
  unresolved: string[];
  violations: Violation[];
};

export const checkParity = (componentsRoot: string, tsconfigPath: string): ParityReport => {
  const dirs = fs
    .readdirSync(componentsRoot)
    .filter((dir) => fs.existsSync(path.join(componentsRoot, dir, 'config.json')));

  const entries = dirs
    .map((dir) => ({
      dir,
      file: ['index.tsx', 'index.ts'].map((name) => path.join(componentsRoot, dir, name)).find(fs.existsSync),
    }))
    .filter((entry): entry is { dir: string; file: string } => Boolean(entry.file));

  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(tsconfigPath));
  const program = ts.createProgram(
    entries.map((entry) => entry.file),
    { ...parsed.options, noEmit: true },
  );
  const checker = program.getTypeChecker();

  const report: ParityReport = { checked: [], unresolved: [], violations: [] };

  for (const { dir, file } of entries) {
    const source = program.getSourceFile(file);
    const component = source ? findComponent(source, checker) : null;
    if (!component?.parameters.length) {
      report.unresolved.push(dir);
      continue;
    }
    report.checked.push(dir);

    const propsType = checker.getTypeAtLocation(component.parameters[0]);
    const accepted = new Set(checker.getPropertiesOfType(propsType).map((symbol) => symbol.getName()));

    const config = JSON.parse(fs.readFileSync(path.join(componentsRoot, dir, 'config.json'), 'utf8'));
    const source_ = runtimeSource(path.join(componentsRoot, dir));

    for (const { name, format } of declaredInConfig(config)) {
      if (accepted.has(name)) continue;
      /* Not a declared prop. Only a violation if the component never mentions
         it at all — some props are read indirectly, off a nested object. */
      if (new RegExp(`\\b${name}\\b`).test(source_)) continue;
      report.violations.push({
        component: dir,
        property: name,
        format,
        id: `${dir.replace(/^(Pega_Extensions_|Rohan_IDC_)/, '')}.${name}`,
      });
    }
  }
  return report;
};
