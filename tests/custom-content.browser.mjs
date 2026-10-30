import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3211';

test('free content slots preserve text, alignment and independent bold in all templates', {timeout:90000}, async t => {
  const edge = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
  const browser = await chromium.launch({executablePath: existsSync(chromium.executablePath()) ? undefined : edge});
  t.after(() => browser.close());
  const page = await browser.newPage({viewport:{width:1280,height:1000}});
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${base}/app/dashboard`);
  const {id,templates} = await page.evaluate(async()=>{
    const {useResumeStore}=await import('/src/store/useResumeStore.ts');
    const {DEFAULT_TEMPLATES}=await import('/src/components/templates/registry.ts');
    const id=useResumeStore.getState().createResume(null,true);
    const s=useResumeStore.getState(), r=s.activeResume;
    s.updateResume(id,{
      menuSections:[...r.menuSections,{id:'custom-content',title:'比赛经历',icon:'➕',enabled:true,order:r.menuSections.length}],
      activeSection:'custom-content',
      customData:{'custom-content':[
        {id:'entry',title:'超级大赛',subtitle:'项目负责人',dateRange:'省级一等奖',description:'<p>独立完成项目设计与开发。</p>',visible:true},
        {id:'legacy',title:'旧记录',subtitle:'',dateRange:'2026/02 - 2027/05',description:'',visible:true},
      ]},
      globalSettings:{...r.globalSettings,centerSubtitle:false,dateFormat:'short-month',fieldColors:{'customData.custom-content.entry.dateRange':'#3730A3'}},
    });
    return {id,templates:DEFAULT_TEMPLATES.map(t=>t.id)};
  });
  await page.goto(`${base}/app/workbench/${id}`);
  await page.getByRole('navigation',{name:'模块导航'}).waitFor();
  await page.locator('h3:visible').filter({hasText:'超级大赛'}).first().click();
  await page.getByRole('textbox',{name:'内容－右',exact:true}).fill('省级一等奖 · 个人项目');
  assert.equal(await page.getByRole('textbox',{name:'内容－右',exact:true}).getAttribute('type'),'text');
  await page.getByRole('button',{name:'内容－左加粗',exact:true}).click();
  await page.getByRole('button',{name:'内容－中加粗',exact:true}).click();
  await page.getByRole('button',{name:'内容－右加粗',exact:true}).click();
  for(const templateId of templates) {
    await page.evaluate(async templateId=>{const {useResumeStore}=await import('/src/store/useResumeStore.ts');const s=useResumeStore.getState();s.updateResume(s.activeResumeId,{templateId});},templateId);
    const header=page.locator('#resume-preview [data-custom-header="entry"]');
    await header.waitFor();
    const result=await header.evaluate(el=>({
      columns:[...el.children].map(node=>({text:node.textContent,align:getComputedStyle(node).textAlign,weight:getComputedStyle(node).fontWeight,rect:node.getBoundingClientRect().toJSON()})),
      color:getComputedStyle(el.children[2].firstElementChild).color,
      legacy:document.querySelector('#resume-preview [data-custom-header="legacy"] [data-custom-column="right"]').textContent,
    }));
    assert.deepEqual(result.columns.map(c=>c.text),['超级大赛','项目负责人','省级一等奖 · 个人项目'],templateId);
    assert.deepEqual(result.columns.map(c=>c.align),['left','center','right']);
    assert.deepEqual(result.columns.map(c=>c.weight),['400','700','700']);
    assert.equal(result.color,'rgb(55, 48, 163)');
    assert.equal(result.legacy,'2026/02 - 2027/05');
    assert.ok(result.columns[0].rect.right<result.columns[1].rect.x && result.columns[1].rect.right<result.columns[2].rect.x);
  }
  // Persisted JSON and the export DOM keep free text and explicit emphasis.
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('resume-storage')).state.resumes);
  assert.deepEqual(saved[id].customData['custom-content'][0].fieldBold,{title:false,subtitle:true,dateRange:true});
  await page.reload();
  const header=page.locator('#resume-preview [data-custom-header="entry"]');await header.waitFor();
  assert.equal(await header.locator('[data-custom-column="right"]').evaluate(el=>getComputedStyle(el).fontWeight),'700');
  await mkdir('node_modules/.cache/custom-content',{recursive:true});
  await page.screenshot({path:'node_modules/.cache/custom-content/desktop.png'});
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'内容',exact:true}).click();
  await page.locator('h3:visible').filter({hasText:'超级大赛'}).first().click();
  const right=page.getByRole('textbox',{name:'内容－右',exact:true});
  await right.scrollIntoViewIfNeeded();
  const rect=await right.boundingBox();assert.ok(rect.x>=0 && rect.x+rect.width<=390);
  assert.equal(await page.getByRole('button',{name:'内容－右加粗',exact:true}).getAttribute('aria-pressed'),'true');
  await page.screenshot({path:'node_modules/.cache/custom-content/mobile.png'});
  assert.deepEqual(errors,[]);
});
