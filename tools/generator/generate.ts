/**
 * Writes a component folder to disk, formatting with the repo's prettier config
 * so generated files satisfy eslint-plugin-prettier.
 *
 * prettier is imported lazily: it is ESM-only from v3, so a static import here
 * would break any CommonJS consumer, jest included.
 */
import fs from 'fs';
import path from 'path';
import type { ResolvedSpec } from './define';
import { renderComponent, type GeneratedFile } from './render';

const parserFor = (name: string) => (name.endsWith('.json') ? 'json' : name.endsWith('.mdx') ? 'mdx' : 'typescript');

export const formatFiles = async (files: GeneratedFile[], cwd: string): Promise<GeneratedFile[]> => {
  const prettier = await import('prettier');
  /* resolveConfig wants a representative *file* path, not a directory, or the
     repo's .prettierrc.json is never found and output uses prettier defaults. */
  const config = (await prettier.resolveConfig(path.join(cwd, 'src/components/x.tsx'))) ?? {};

  return Promise.all(
    files.map(async (file) => {
      try {
        return {
          ...file,
          contents: await prettier.format(file.contents, { ...config, parser: parserFor(file.name) }),
        };
      } catch (error) {
        throw new Error(`generated ${file.name} is not parseable: ${(error as Error).message}`);
      }
    }),
  );
};

export type WriteResult = { directory: string; files: string[] };

/** Render, format and write a component folder. Refuses to overwrite. */
export const writeComponent = async (
  spec: ResolvedSpec,
  componentsRoot: string,
  options: { force?: boolean; cwd?: string } = {},
): Promise<WriteResult> => {
  const directory = path.join(componentsRoot, spec.componentKey);
  if (fs.existsSync(directory) && !options.force) {
    throw new Error(`${spec.componentKey} already exists. Pass --force to overwrite.`);
  }

  const files = await formatFiles(renderComponent(spec), options.cwd ?? process.cwd());
  fs.mkdirSync(directory, { recursive: true });
  for (const file of files) {
    fs.writeFileSync(path.join(directory, file.name), file.contents);
  }
  return { directory, files: files.map((file) => file.name) };
};
