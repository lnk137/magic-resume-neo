import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const origin = process.env.TEST_BASE_URL || 'http://127.0.0.1:3212';

test('custom basic fields remain aligned and editable at desktop and mobile widths', { timeout: 60000 }, async t => {
  const edge = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
  const browser = await chromium.launch({ executablePath: existsSync(chromium.executablePath()) ? undefined : edge });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${origin}/app/dashboard`);
  const id = await page.evaluate(async () => {
    const { useResumeStore } = await import('/src/store/useResumeStore.ts');
    const id = useResumeStore.getState().createResume(null);
    const state = useResumeStore.getState();
    state.updateResume(id, { activeSection: 'basic', basic: { ...state.activeResume.basic, customFields: [{ id: 'test-field', label: '姓名', value: '巴赫', visible: true, displayLabel: false }] } });
    return id;
  });
  await page.goto(`${origin}/app/workbench/${id}`);
  const label = page.getByRole('textbox', { name: '标签', exact: true });
  const value = page.getByRole('textbox', { name: '值', exact: true });
  await label.waitFor();
  const check = async () => {
    const boxes = await Promise.all([label.boundingBox(), value.boundingBox(), label.locator('xpath=../..').getByRole('button', { name: '姓名颜色' }).boundingBox(), page.getByRole('switch', { name: '显示标签' }).boundingBox()]);
    assert.ok(boxes.every(Boolean));
    assert.ok(Math.abs(boxes[0].y - boxes[1].y) < 1, 'inputs must share a baseline');
    assert.ok(boxes[2].y >= boxes[1].y && boxes[2].y + boxes[2].height <= boxes[1].y + boxes[1].height, 'color control aligns with inputs');
    assert.ok(boxes[3].y >= boxes[0].y + boxes[0].height, 'actions use a separate row');
    const phone = await page.getByPlaceholder('请输入电话').filter({visible:true}).boundingBox();
    assert.ok(phone && phone.width >= 120, 'built-in fields have usable input width');
    assert.ok(boxes.every(box => box.x >= 0 && box.x + box.width <= page.viewportSize().width + 1), 'controls stay on screen');
  };
  await check();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: '内容', exact: true }).click();
  await label.scrollIntoViewIfNeeded();
  await check();
  await label.fill('院校');
  assert.equal(await label.inputValue(), '院校');
  await value.fill('南京林业大学');
  assert.equal(await label.inputValue(), '院校');
  await page.getByRole('switch', { name: '显示标签' }).click();
  assert.equal(await label.inputValue(), '院校');
  assert.equal(await label.inputValue(), '院校');
  assert.equal(await value.inputValue(), '南京林业大学');
  assert.equal(await page.getByRole('switch', { name: '显示标签' }).getAttribute('data-state'), 'checked');
  await page.screenshot({ path: 'node_modules/.cache/basic-custom-layout.png' });
});
