/**
 * Takes a picture of every Storybook story of one component, so a person or
 * Claude can compare what was built with a screenshot or mockup.
 *
 *   npm run snapshot -- Toggle [--out <dir>] [--width 1280] [--theme <name>] [--full] [--keep]
 *
 * Uses the Storybook on STORYBOOK_URL (default http://localhost:6006) when it
 * is running; otherwise starts one, and stops it afterwards unless --keep.
 * Pictures go to .snapshots/<component>/<story>.png (git-ignored). Errors a
 * story throws in the browser are printed, because a blank picture alone does
 * not say why. Pictures are cropped to the story; --full keeps the whole page,
 * for stories that open popovers or dialogs outside it.
 */
import { spawn, type ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { componentKeyOf, storiesFor, storyUrl, type StorybookIndex } from './stories';

const ROOT = path.resolve(__dirname, '../..');
const BASE = process.env.STORYBOOK_URL ?? 'http://localhost:6006';
const START_TIMEOUT_MS = 240_000;

const option = (args: string[], name: string): string | undefined => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 ? args[at + 1] : undefined;
};

const fetchIndex = async (): Promise<StorybookIndex | undefined> => {
  try {
    const response = await fetch(new URL('index.json', `${BASE}/`));
    return response.ok ? ((await response.json()) as StorybookIndex) : undefined;
  } catch {
    return undefined;
  }
};

const startStorybook = async (): Promise<ChildProcess> => {
  const port = new URL(BASE).port || '6006';
  const log = fs.openSync(path.join(ROOT, '.snapshots', 'storybook.log'), 'w');
  console.log(`Starting Storybook on port ${port} (log: .snapshots/storybook.log)…`);
  const child = spawn('npx', ['storybook', 'dev', '--ci', '--no-open', '--port', port], {
    cwd: ROOT,
    stdio: ['ignore', log, log],
    detached: true,
  });
  const deadline = Date.now() + START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('Storybook exited while starting; see .snapshots/storybook.log');
    if (await fetchIndex()) return child;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`Storybook did not answer on ${BASE} within ${START_TIMEOUT_MS / 1000}s`);
};

const main = async () => {
  const args = process.argv.slice(2);
  const target = args.find((arg, i) => !arg.startsWith('--') && !args[i - 1]?.startsWith('--'));
  if (!target) {
    console.error(
      'usage: npm run snapshot -- <Component> [--out <dir>] [--width 1280] [--theme <name>] [--full] [--keep]',
    );
    process.exit(2);
  }
  const componentKey = componentKeyOf(target);
  const outDir = path.resolve(option(args, 'out') ?? path.join(ROOT, '.snapshots', componentKey));
  const width = Number(option(args, 'width') ?? 1280);
  const theme = option(args, 'theme');
  fs.mkdirSync(path.join(ROOT, '.snapshots'), { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });

  let storybook: ChildProcess | undefined;
  let index = await fetchIndex();
  if (!index) {
    storybook = await startStorybook();
    index = await fetchIndex();
  }

  const stories = storiesFor(index!, componentKey);
  if (stories.length === 0) {
    throw new Error(`No stories found for ${componentKey}. Is there a demo.stories.tsx in its folder?`);
  }

  const browser = await chromium.launch();
  let failures = 0;
  try {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    for (const story of stories) {
      const errors: string[] = [];
      const onError = (error: Error) => errors.push(error.message);
      page.on('pageerror', onError);

      /* Not 'networkidle': the dev server holds a live-reload connection open. */
      await page.goto(storyUrl(BASE, story.id, theme), { waitUntil: 'load', timeout: 120_000 });
      /* Storybook marks the body once the story has rendered, or failed to.
         The first story can wait on the dev server's first compile. */
      await page.waitForSelector('body.sb-show-main, body.sb-show-errordisplay', { timeout: 120_000 });
      /* Let fonts, images and async data settle before the picture. */
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1000);
      const storyError = await page
        .locator('body.sb-show-errordisplay #error-message')
        .textContent({ timeout: 100 })
        .catch(() => null);
      if (storyError) errors.push(storyError.trim());

      const file = path.join(outDir, `${story.id}.png`);
      const root = page.locator('#storybook-root');
      const box = await root.boundingBox();
      if (args.includes('--full') || !box || box.height < 1) {
        await page.screenshot({ path: file, fullPage: true });
      } else {
        await root.screenshot({ path: file });
      }
      page.off('pageerror', onError);

      console.log(`${errors.length ? '✗' : '✓'} ${story.title} / ${story.name}\n    ${path.relative(ROOT, file)}`);
      errors.forEach((message) => console.log(`    error: ${message.split('\n')[0]}`));
      if (errors.length) failures += 1;
    }
  } finally {
    await browser.close();
    if (storybook && !args.includes('--keep')) process.kill(-storybook.pid!);
  }
  if (failures) process.exitCode = 1;
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
