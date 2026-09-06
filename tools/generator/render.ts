/**
 * Pure rendering: spec in, file contents out, no disk and no formatter.
 *
 * Kept separate from generate.ts so tests can exercise it directly — prettier 3
 * is ESM-only and cannot be loaded inside jest's CommonJS VM.
 */
import type { ResolvedSpec } from './define';
import { emitConfig } from './emit-config';
import { emitComponent, emitDocs, emitStories, emitStyles, emitTest } from './emit-component';

export type GeneratedFile = { name: string; contents: string };

export const renderComponent = (spec: ResolvedSpec, builtOn?: Date): GeneratedFile[] => [
  { name: 'config.json', contents: emitConfig(spec, builtOn) },
  { name: 'index.tsx', contents: emitComponent(spec) },
  { name: 'styles.ts', contents: emitStyles(spec) },
  { name: 'demo.stories.tsx', contents: emitStories(spec) },
  { name: 'demo.test.tsx', contents: emitTest(spec) },
  { name: 'Docs.mdx', contents: emitDocs(spec) },
];
