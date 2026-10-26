import { readFile } from "node:fs/promises";
import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium } from 'playwright';
const base = process.env.PREVIEW_TEST_URL || 'http://127.0.0.1:3211';

test('all nine templates preserve field colors, rich marks, history and reload', {timeout: 90000}, async (t) => {
  const browser = await chromium.launch({channel:process.env.BROWSER_CHANNEL || 'chrome'}); t.after(()=>browser.close());
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  await page.addInitScript(()=>{window.__REACT_GRAB_DISABLED__=true;});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}/app/dashboard`);
  const {id,templates}=await page.evaluate(async()=>{
    const {useResumeStore}=await import(performance.getEntriesByType('resource').filter(entry => entry.name.includes('/src/store/useResumeStore.ts')).at(-1)?.name || '/src/store/useResumeStore.ts');
    const {DEFAULT_TEMPLATES}=await import('/src/components/templates/registry.ts');
    const store=useResumeStore.getState(); const id=store.createResume(DEFAULT_TEMPLATES[0].id);
    const resume=useResumeStore.getState().activeResume;
    store.updateResume(id,{
      basic:{...resume.basic,name:'COLOR NAME',title:'COLOR ROLE'},
      education:[{id:'edu-color',school:'COLOR SCHOOL',major:'COLOR MAJOR',degree:'COLOR DEGREE',gpa:'3.9',startDate:'2020-01',endDate:'2024-01',description:'<p>EDU BODY</p>',visible:true}],
      experience:[{id:'exp-color',company:'COLOR COMPANY',position:'COLOR POSITION',date:'2020-01 - 2024-01',details:'<p>EXPERIENCE BODY</p>',visible:true}],
      projects:[{id:'project-color',name:'COLOR PROJECT',role:'COLOR PROJECT ROLE',date:'2020-01 - 2024-01',description:'<p>PROJECT BODY</p>',visible:true}],
      skillContent:'<p>BODY COLOR <span style="color: #be123c">SELECTED RUN</span></p>',
      globalSettings:{...resume.globalSettings,autoOnePage:false,textColors:{body:'#166534',name:'#1E40AF',title:'#155E75',subtitle:'#6B21A8',date:'#A16207',section:'#9D174D'},fieldColors:{'basic.name':'#C2410C','education.edu-color.major':'#0F766E'}}
    });
    return {id,templates:DEFAULT_TEMPLATES.map(t=>({id:t.id,layout:t.layout}))};
  });
  await page.goto(`${base}/app/workbench/${id}`);await page.waitForSelector('#resume-preview');
  for(const template of templates){
    await page.evaluate(async(templateId)=>{const {useResumeStore}=await import(performance.getEntriesByType('resource').filter(entry => entry.name.includes('/src/store/useResumeStore.ts')).at(-1)?.name || '/src/store/useResumeStore.ts');const s=useResumeStore.getState();s.updateResume(s.activeResumeId,{templateId});},template.id);
    await page.waitForFunction(()=>document.querySelector('#resume-preview [data-resume-field="basic.name"]'));
    const result=await page.evaluate(async()=>{
      const preview=document.querySelector('#resume-preview');
      const color=selector=>{const element=preview.querySelector(selector);return element?getComputedStyle(element).color:null;};
      const run=[...preview.querySelectorAll('span')].find(el=>el.textContent==='SELECTED RUN');
      const rich=[...preview.querySelectorAll('p')].find(el=>el.textContent.includes('BODY COLOR'));
      const bodies=['EDU BODY','EXPERIENCE BODY','PROJECT BODY'].map(text=>{const el=[...preview.querySelectorAll('p')].find(p=>p.textContent===text);return el?getComputedStyle(el).color:null;});
      const {cloneResumeForExport}=await import('/src/utils/resumeLayout.ts');
      const clone=cloneResumeForExport(preview,true); const host=document.createElement('div'); host.style.position='absolute'; host.style.left='-99999px';host.append(clone);document.body.append(host);
      const exportedName=getComputedStyle(clone.querySelector('[data-resume-field="basic.name"]')).color;
      const exportedRun=getComputedStyle([...clone.querySelectorAll('span')].find(el=>el.textContent==='SELECTED RUN')).color;
      const exportMarkup=clone.outerHTML;host.remove();
      return {exportedName,exportedRun,exportMarkup,bodies,name:color('[data-resume-field="basic.name"]'),school:color('[data-resume-field="education.edu-color.school"]'),major:color('[data-resume-field="education.edu-color.major"]'),date:color('[data-resume-field="education.edu-color.date"]'),section:color('[data-text-role="section"]'),body:rich?getComputedStyle(rich).color:null,run:run?getComputedStyle(run).color:null};
    });
    assert.equal(result.exportedName,'rgb(194, 65, 12)',`${template.layout} PDF export name`);
    assert.equal(result.exportedRun,'rgb(190, 18, 60)',`${template.layout} PDF export rich mark`);
    assert.ok(result.exportMarkup.includes('color: rgb(194, 65, 12)'));
    assert.equal(result.name,'rgb(194, 65, 12)',`${template.layout} field name`);
    assert.equal(result.school,'rgb(21, 94, 117)',`${template.layout} title`);
    assert.equal(result.major,'rgb(15, 118, 110)',`${template.layout} major`);
    assert.equal(result.date,'rgb(161, 98, 7)',`${template.layout} date`);
    assert.equal(result.section,'rgb(157, 23, 77)',`${template.layout} section`);
    assert.deepEqual(result.bodies,Array(3).fill('rgb(22, 101, 52)'),`${template.layout} rich description bodies`);
    assert.equal(result.body,'rgb(22, 101, 52)',`${template.layout} rich body`);
    assert.equal(result.run,'rgb(190, 18, 60)',`${template.layout} selected marks`);
  }
  const downloaded=page.waitForEvent('download');
  await page.evaluate(async()=>{const {useResumeStore}=await import(performance.getEntriesByType('resource').filter(entry => entry.name.includes('/src/store/useResumeStore.ts')).at(-1)?.name || '/src/store/useResumeStore.ts');const {exportResumeAsJson}=await import('/src/utils/export.ts');exportResumeAsJson({resume:useResumeStore.getState().activeResume});});
  const exported=JSON.parse(await readFile(await (await downloaded).path(),'utf8'));
  assert.equal(exported.globalSettings.fieldColors['basic.name'],'#C2410C');
  assert.ok(exported.skillContent.includes('#be123c'));
  // A real palette interaction updates state, keeps invalid HEX local, and resets to inheritance.
  const nameControl=page.getByRole('button',{name:'姓名默认颜色',exact:true});
  await nameControl.first().click();
  const hex=page.getByRole('textbox',{name:'HEX 颜色值'});
  await hex.fill('#zzzzzz');
  assert.equal(await page.evaluate(async()=>{const {useResumeStore}=await import(performance.getEntriesByType('resource').filter(entry => entry.name.includes('/src/store/useResumeStore.ts')).at(-1)?.name || '/src/store/useResumeStore.ts');return useResumeStore.getState().activeResume.globalSettings.textColors.name;}),'#1E40AF');
  await hex.fill('#112233');
  if(process.env.COLOR_SCREENSHOT_DIR) { await page.waitForTimeout(350); await page.screenshot({path:process.env.COLOR_SCREENSHOT_DIR+'/color-picker-desktop.png'}); }
  await page.keyboard.press('Escape');
  const before=await page.evaluate(async()=>{const {useResumeStore}=await import(performance.getEntriesByType('resource').filter(entry => entry.name.includes('/src/store/useResumeStore.ts')).at(-1)?.name || '/src/store/useResumeStore.ts');return useResumeStore.getState().activeResume.globalSettings.textColors.name;});
  assert.equal(before,'#112233');
  await page.evaluate(async()=>{const {useResumeStore}=await import(performance.getEntriesByType('resource').filter(entry => entry.name.includes('/src/store/useResumeStore.ts')).at(-1)?.name || '/src/store/useResumeStore.ts');useResumeStore.getState().undo();});
  assert.equal(await page.evaluate(async()=>{const {useResumeStore}=await import(performance.getEntriesByType('resource').filter(entry => entry.name.includes('/src/store/useResumeStore.ts')).at(-1)?.name || '/src/store/useResumeStore.ts');return useResumeStore.getState().activeResume.globalSettings.textColors.name;}),'#1E40AF');
  await page.reload();await page.waitForSelector('#resume-preview');
  assert.equal(await page.locator('#resume-preview [data-resume-field="basic.name"]').evaluate(el=>getComputedStyle(el).color),'rgb(194, 65, 12)');
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'样式',exact:true}).click();
  await page.getByRole('button',{name:'姓名默认颜色',exact:true}).click();
  await page.getByRole('textbox',{name:'HEX 颜色值'}).waitFor();
  const palette=page.getByRole('textbox',{name:'HEX 颜色值'}).locator('..').locator('..');
  const box=await palette.boundingBox(); assert.ok(box.x>=0&&box.x+box.width<=390&&box.y>=0&&box.y+box.height<=844);
  if(process.env.COLOR_SCREENSHOT_DIR){await page.waitForTimeout(350);await page.screenshot({path:process.env.COLOR_SCREENSHOT_DIR+'/color-picker-mobile.png'});}
  assert.deepEqual(errors,[]);
});
