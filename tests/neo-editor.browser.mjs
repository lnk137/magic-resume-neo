import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const origin = process.env.TEST_BASE_URL || 'http://127.0.0.1:3211';

test('module navigation and custom controls work with collapsed sidebar and narrow viewport', { timeout: 90_000 }, async (t) => {
  const edge = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
  const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH || (existsSync(chromium.executablePath()) ? undefined : existsSync(edge) ? edge : undefined);
  const browser = await chromium.launch({ executablePath });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${origin}/app/dashboard`);
  const id = await page.evaluate(async () => {
    const { useResumeStore } = await import(performance.getEntriesByType('resource').findLast(entry => entry.name.includes('/src/store/useResumeStore.ts'))?.name || '/src/store/useResumeStore.ts');
    return useResumeStore.getState().createResume(null);
  });
  await page.goto(`${origin}/app/workbench/${id}`);
  const nav = page.getByRole('navigation', { name: '模块导航' });
  await nav.waitFor();
  await nav.getByRole('button', { name: '添加模块', exact: true }).click();
  await page.getByRole('button', { name: '添加自定义模块', exact: true }).click();
  await page.getByText('未命名模块', { exact: true }).first().click();
  const titleInput = page.locator('input[type="text"][placeholder="左侧内容"]');
  await titleInput.fill('超级大赛');
  await page.locator('input[type="text"][placeholder="中间内容"]').fill('一等奖');
  await page.getByText('字段与排版', { exact: true }).click();
  await page.getByRole('textbox', { name: '内容－中字段名称', exact: true }).fill('奖项');
  await page.getByRole('switch', { name: '在简历中显示内容－中', exact: true }).click();
  await page.getByRole('button', { name: '居中', exact: true }).click();
  await page.getByRole('button', { name: '复制条目', exact: true }).click();
  const snapshot = await page.evaluate(async () => {
    const { useResumeStore } = await import(performance.getEntriesByType('resource').findLast(entry => entry.name.includes('/src/store/useResumeStore.ts'))?.name || '/src/store/useResumeStore.ts');
    return useResumeStore.getState().activeResume;
  });
  const entries = snapshot.customData[snapshot.activeSection];
  assert.equal(entries.length, 2);
  assert.equal(entries[0].subtitle, '一等奖');
  assert.deepEqual(entries[0].hiddenFields, ['subtitle']);
  assert.equal(entries[0].fieldLabels.subtitle, '奖项');
  assert.equal(entries[0].alignment, 'center');
  assert.notEqual(entries[0].id, entries[1].id);
  await page.getByRole('button', { name: '复制模块', exact: true }).click();
  await page.waitForFunction(async () => {
    const { useResumeStore } = await import(performance.getEntriesByType('resource').findLast(entry => entry.name.includes('/src/store/useResumeStore.ts'))?.name || '/src/store/useResumeStore.ts');
    return useResumeStore.getState().activeResume.menuSections.some(section => section.title.endsWith('副本'));
  });
  await mkdir('node_modules/.cache/neo-editor', { recursive: true });
  await page.screenshot({ path: 'node_modules/.cache/neo-editor/desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: '内容', exact: true }).click();
  await nav.waitFor();
  await nav.getByRole('combobox').click();
  await page.getByRole('option', { name: '专业技能', exact: true }).click();
  assert.equal(await nav.getByRole('button', { name: '添加模块', exact: true }).isVisible(), true);
  await nav.getByRole('combobox').click();
  await page.getByRole('option', { name: '自定义模块 副本', exact: true }).click();
  await page.locator('h3:visible').filter({ hasText: '超级大赛' }).first().click();
  await page.locator('summary:visible').filter({ hasText: '字段与排版' }).first().click();
  const size = await nav.evaluate(el => ({ left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right, width: innerWidth }));
  assert.ok(size.left >= 0 && size.right <= size.width + 1);
  await page.screenshot({ path: 'node_modules/.cache/neo-editor/mobile.png', fullPage: true });
  assert.deepEqual(errors, []);
});
