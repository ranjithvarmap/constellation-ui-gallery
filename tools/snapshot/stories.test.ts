import { componentKeyOf, storiesFor, storyUrl, type StorybookIndex } from './stories';

const entry = (id: string, importPath: string, type: 'story' | 'docs' = 'story') => ({
  id,
  title: id.split('--')[0],
  name: id.split('--')[1] ?? 'Docs',
  importPath,
  type,
});

const index: StorybookIndex = {
  v: 5,
  entries: {
    'fields-toggle--default': entry(
      'fields-toggle--default',
      './src/components/Pega_Extensions_Toggle/demo.stories.tsx',
    ),
    'fields-toggle--on': entry('fields-toggle--on', './src/components/Pega_Extensions_Toggle/demo.stories.tsx'),
    'fields-toggle--docs': entry('fields-toggle--docs', './src/components/Pega_Extensions_Toggle/Docs.mdx', 'docs'),
    /* A folder whose name starts with the same text must not match. */
    'fields-togglegroup--default': entry(
      'fields-togglegroup--default',
      './src/components/Pega_Extensions_ToggleGroup/demo.stories.tsx',
    ),
  },
};

test('accepts a short name, the folder name or a path', () => {
  expect(componentKeyOf('Toggle')).toBe('Pega_Extensions_Toggle');
  expect(componentKeyOf('Pega_Extensions_Toggle')).toBe('Pega_Extensions_Toggle');
  expect(componentKeyOf('src/components/Pega_Extensions_Toggle/')).toBe('Pega_Extensions_Toggle');
});

test("picks only that component's stories, not its docs or a similarly named folder", () => {
  expect(storiesFor(index, 'Pega_Extensions_Toggle').map((story) => story.id)).toEqual([
    'fields-toggle--default',
    'fields-toggle--on',
  ]);
});

test('renders a story alone, optionally in a named theme', () => {
  expect(storyUrl('http://localhost:6006', 'fields-toggle--on')).toBe(
    'http://localhost:6006/iframe.html?id=fields-toggle--on&viewMode=story',
  );
  expect(storyUrl('http://localhost:6006/', 'fields-toggle--on', 'Mantis')).toBe(
    'http://localhost:6006/iframe.html?id=fields-toggle--on&viewMode=story&globals=theme%3AMantis',
  );
});
