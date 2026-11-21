/**
 * Picks a component's stories out of Storybook's index.json. Kept apart from
 * the browser code so it can be tested without a browser.
 */

export type IndexEntry = {
  id: string;
  title: string;
  name: string;
  importPath: string;
  type: 'story' | 'docs';
};

export type StorybookIndex = { v: number; entries: Record<string, IndexEntry> };

/** Accepts `Toggle`, `Pega_Extensions_Toggle` or a path ending in the folder. */
export const componentKeyOf = (input: string): string => {
  const folder =
    input
      .replace(/[\\/]+$/, '')
      .split(/[\\/]/)
      .pop() ?? input;
  return folder.startsWith('Pega_Extensions_') ? folder : `Pega_Extensions_${folder}`;
};

/** The component's stories, in the order Storybook lists them. Docs pages are left out. */
export const storiesFor = (index: StorybookIndex, componentKey: string): IndexEntry[] =>
  Object.values(index.entries).filter(
    (entry) => entry.type === 'story' && entry.importPath.split('/').includes(componentKey),
  );

/** The URL that renders one story on its own, without Storybook's UI around it. */
export const storyUrl = (base: string, id: string, theme?: string): string => {
  const url = new URL('iframe.html', base.endsWith('/') ? base : `${base}/`);
  url.searchParams.set('id', id);
  url.searchParams.set('viewMode', 'story');
  if (theme) url.searchParams.set('globals', `theme:${theme}`);
  return url.toString();
};
