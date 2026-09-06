/**
 * Non-interactive entry point — the gap the stock Pega CLI leaves.
 *
 *   npx ts-node tools/generator/cli.ts path/to/my-field.spec.ts [--force]
 *
 * The spec module must default-export the result of defineField().
 */
import path from 'path';
import { writeComponent } from './generate';
import type { ResolvedSpec } from './define';

const main = async () => {
  const args = process.argv.slice(2);
  const specPath = args.find((arg) => !arg.startsWith('--'));
  const force = args.includes('--force');

  if (!specPath) {
    console.error('usage: cli.ts <spec-file> [--force]');
    process.exit(2);
  }

  const resolved = path.resolve(specPath);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const module_ = require(resolved);
  const spec: ResolvedSpec = module_.default ?? module_.spec;
  if (!spec?.componentKey) {
    console.error(`${specPath} must default-export the result of defineField()`);
    process.exit(2);
  }

  const componentsRoot = path.resolve(__dirname, '../../src/components');
  const result = await writeComponent(spec, componentsRoot, { force });

  console.log(`Generated ${spec.componentKey}`);
  result.files.forEach((file) => console.log(`  ${file}`));
  console.log('\nNext: npx tsc --noEmit && npx jest && npx eslint ./src');
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
