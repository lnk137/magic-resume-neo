import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const origin = process.env.TEST_BASE_URL || 'http://127.0.0.1:3212';

test('imported colors on bold and block elements survive editing and reload', { timeout: 60000 }, async t => {
  const edge = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
  const browser = await chromium.launch({ executablePath: existsSync(chromium.executablePath()) ? undefined : edge });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${origin}/app/dashboard`);
  const id = await page.evaluate(async () => {
    const {useResumeStore}=await import('/src/store/useResumeStore.ts');
    const id=useResumeStore.getState().createResume(null);
    const state=useResumeStore.getState(), r=state.activeResume;
    state.updateResume(id, {activeSection:'custom-color',menuSections:[...r.menuSections,{id:'custom-color',title:'测试',icon:'',enabled:true,order:r.menuSections.length}],customData:{'custom-color':[{id:'entry',title:'测试条目',subtitle:'',dateRange:'',description:'<p><strong style="color: #29468e">工作内容：</strong>正文</p><p style="text-align: right"><strong style="color: #d94e42">论文成果</strong></p><p style="color: #008000">段落颜色 <span style="color: #0000ff">嵌套蓝色</span></p>',visible:true}]}});
    return id;
  });
  await page.goto(`${origin}/app/workbench/${id}`);
  await page.getByRole('heading',{name:'测试条目'}).first().click();
  const editor=page.locator('.tiptap[contenteditable=true]:visible').first();
  await editor.waitFor();
  const colorOf=async(root,text)=>root.getByText(text,{exact:true}).evaluate(el=>getComputedStyle(el).color);
  const verify=async()=>{
    assert.equal(await colorOf(editor,'工作内容：'),'rgb(41, 70, 142)');
    assert.equal(await colorOf(editor,'论文成果'),'rgb(217, 78, 66)');
    assert.equal(await colorOf(editor,'嵌套蓝色'),'rgb(0, 0, 255)');
    assert.equal(await editor.locator('p').last().locator('span').first().evaluate(el=>getComputedStyle(el).color),'rgb(0, 128, 0)');
    const preview=page.locator('#resume-preview');
    assert.equal(await colorOf(preview,'论文成果'),'rgb(217, 78, 66)');
  };
  await verify();
  await page.screenshot({path:'node_modules/.cache/rich-editor-colors.png'});
  const original=await page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('resume-storage')).state.resumes).find(r=>r.customData?.['custom-color'])?.customData['custom-color'][0].description);
  assert.ok(original.includes('<strong style="color: #d94e42">'));
  await editor.locator('p').first().click();
  await page.keyboard.press('End');
  await page.keyboard.type('!');
  await verify();
  await page.reload();
  await page.getByRole('heading',{name:'测试条目'}).first().click();
  await editor.waitFor();
  await verify();
  const stored=await page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('resume-storage')).state.resumes).find(r=>r.customData?.['custom-color'])?.customData['custom-color'][0].description);
  assert.ok(stored.includes('d94e42') || stored.includes('217, 78, 66'));
  assert.ok(stored.includes('!'));
});
