/**
 * Non-interactive entry point — the gap the stock Pega CLI leaves.
 *
 *   npx ts-node tools/generator/cli.ts path/to/my-field.spec.ts [--force]
 *   npx ts-node tools/generator/cli.ts path/to/my-field.spec.ts --plan
 *
 * --plan prints what would be generated and writes nothing.
 *
 * The spec module must default-export the result of defineField(),
 * defineTemplate() or defineWidget().
 */
import fs from 'fs';
import path from 'path';
import { formatFiles, writeComponent } from './generate';
import { describePlan } from './plan';
import { renderComponent } from './render';
import type { ResolvedSpec } from './define';

const main = async () => {
  const args = process.argv.slice(2);
  const specPath = args.find((arg) => !arg.startsWith('--'));
  const force = args.includes('--force');
  const plan = args.includes('--plan');

  if (!specPath) {
    console.error('usage: cli.ts <spec-file> [--force | --plan]');
    process.exit(2);
  }

  const resolved = path.resolve(specPath);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const module_ = require(resolved);
  const spec: ResolvedSpec = module_.default ?? module_.spec;
  if (!spec?.componentKey) {
    console.error(`${specPath} must default-export the result of defineField(), defineTemplate() or defineWidget()`);
    process.exit(2);
  }

  const componentsRoot = path.resolve(__dirname, '../../src/components');
  if (plan) {
    const exists = fs.existsSync(path.join(componentsRoot, spec.componentKey));
    /* Formatted as they would be written, so the TODO line numbers match. */
    console.log(describePlan(spec, await formatFiles(renderComponent(spec), process.cwd()), exists));
    return;
  }
  const result = await writeComponent(spec, componentsRoot, { force });

  console.log(`Generated ${spec.componentKey}`);
  result.files.forEach((file) => console.log(`  ${file}`));
  console.log('\nNext: npx tsc --noEmit && npx jest && npx eslint ./src');
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
