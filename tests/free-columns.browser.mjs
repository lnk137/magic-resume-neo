import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';
const base=process.env.TEST_BASE_URL || 'http://127.0.0.1:3212';

test('free layout redistributes only hidden columns and preserves data, copy and PDF HTML', {timeout:90000}, async t=>{
 const edge='/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
 const browser=await chromium.launch({executablePath:existsSync(chromium.executablePath())?undefined:edge});t.after(()=>browser.close());
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 await page.goto(`${base}/app/dashboard`);
 const {id,templates}=await page.evaluate(async()=>{const {useResumeStore}=await import('/src/store/useResumeStore.ts');const {DEFAULT_TEMPLATES}=await import('/src/components/templates/registry.ts');const id=useResumeStore.getState().createResume(null,true);const s=useResumeStore.getState(),r=s.activeResume;s.updateResume(id,{activeSection:'custom-test',menuSections:[...r.menuSections,{id:'custom-test',title:'比赛',icon:'',enabled:true,order:r.menuSections.length}],customData:{'custom-test':[{id:'entry',title:'比赛名称长文本',subtitle:'中间文字',dateRange:'国家级金奖',description:'<p>描述</p>',visible:true,layoutMode:'free',fieldBold:{subtitle:true},fieldLabels:{subtitle:'身份'}}]},globalSettings:{...r.globalSettings,fieldColors:{'customData.custom-test.entry.subtitle':'#123456'}}});return {id,templates:DEFAULT_TEMPLATES.map(t=>t.id)};});
 await page.goto(`${base}/app/workbench/${id}`);
 const update=async data=>page.evaluate(async data=>{const {useResumeStore}=await import('/src/store/useResumeStore.ts');useResumeStore.getState().updateCustomItem('custom-test','entry',data)},data);
 const header=page.locator('#resume-preview [data-custom-header="entry"]');
 const cases=[{hidden:[],cols:['left','center','right']},{hidden:['subtitle'],cols:['left','right']},{hidden:['title'],cols:['center','right']},{hidden:['dateRange'],cols:['left','center']},{hidden:['title','subtitle'],cols:['right']},{hidden:['title','dateRange'],cols:['center']},{hidden:['subtitle','dateRange'],cols:['left']},{hidden:['title','subtitle','dateRange'],cols:[]}];
 for(const template of templates){
   await page.evaluate(async template=>{const {useResumeStore}=await import('/src/store/useResumeStore.ts');useResumeStore.getState().setTemplate(template)},template);
   for(const scenario of cases){
     await update({hiddenFields:scenario.hidden});
     await page.waitForFunction(expected=>{const el=document.querySelector('#resume-preview [data-custom-header="entry"]');return JSON.stringify(el?[...el.children].map(x=>x.getAttribute('data-custom-column')):[])===JSON.stringify(expected)},scenario.cols);
     if(scenario.cols.length){const result=await header.evaluate(el=>({widths:[...el.children].map(x=>x.getBoundingClientRect().width),alignment:[...el.children].map(x=>getComputedStyle(x).textAlign)}));assert.deepEqual(result.alignment,scenario.cols,template);assert.ok(result.widths.every(w=>w>0),template);}
   }
 }
 await update({hiddenFields:['subtitle'],title:'这是特别长的左侧内容用于测试自适应宽度',dateRange:'短'});
 let widths=await header.evaluate(el=>[...el.children].map(x=>x.getBoundingClientRect().width));assert.ok(widths[0]>widths[1]);
 await update({title:'短',dateRange:'这是特别长的右侧内容用于测试自适应宽度'});
 widths=await header.evaluate(el=>[...el.children].map(x=>x.getBoundingClientRect().width));assert.ok(widths[1]>widths[0]);
 await update({title:'比赛名称长文本',dateRange:'国家级金奖'});
 await update({hiddenFields:[],subtitle:''});await page.waitForFunction(()=>document.querySelectorAll('#resume-preview [data-custom-header="entry"] [data-custom-column]').length===3);
 assert.equal(await header.locator('[data-custom-column="center"]').textContent(),'');
 await update({hiddenFields:['subtitle'],subtitle:'中间文字'});await page.waitForFunction(()=>document.querySelectorAll('#resume-preview [data-custom-header="entry"] [data-custom-column]').length===2);
 const snapshot=await page.evaluate(async()=>{const {useResumeStore}=await import('/src/store/useResumeStore.ts');return useResumeStore.getState().activeResume});
 assert.equal(snapshot.customData['custom-test'][0].subtitle,'中间文字');assert.equal(snapshot.customData['custom-test'][0].fieldLabels.subtitle,'身份');assert.equal(snapshot.customData['custom-test'][0].fieldBold.subtitle,true);assert.equal(snapshot.globalSettings.fieldColors['customData.custom-test.entry.subtitle'],'#123456');
 await page.waitForTimeout(700);await page.screenshot({path:'node_modules/.cache/free-columns.png'});
 let payload;await page.route('**/generate-pdf',async route=>{payload=route.request().postDataJSON();await route.fulfill({status:200,contentType:'application/pdf',body:'test'});});const download=page.waitForEvent('download');await page.evaluate(async()=>{const {exportToPdf}=await import('/src/utils/export.ts');await exportToPdf({elementId:'resume-preview',title:'test',pagePadding:32});});await download;assert.match(payload.content,/display:\s*flex/);assert.doesNotMatch(payload.content,/中间文字/);
 await page.locator('h3:visible').filter({hasText:'比赛名称长文本'}).first().click();await page.getByText('字段与排版',{exact:true}).first().click();await page.getByRole('switch',{name:'在简历中显示内容－中'}).click();await page.waitForFunction(()=>document.querySelectorAll('#resume-preview [data-custom-header="entry"] [data-custom-column]').length===3);assert.equal(await header.locator('[data-custom-column="center"]').textContent(),'中间文字');
 await page.getByRole('switch',{name:'在简历中显示内容－中'}).click();await page.getByRole('button',{name:'复制条目'}).first().click();
 const copies=await page.evaluate(async()=>{const {useResumeStore}=await import('/src/store/useResumeStore.ts');return useResumeStore.getState().activeResume.customData['custom-test']});assert.equal(copies.length,2);assert.equal(copies[1].subtitle,'中间文字');assert.deepEqual(copies[1].hiddenFields,['subtitle']);assert.equal(copies[1].fieldBold.subtitle,true);assert.equal(copies[1].fieldLabels.subtitle,'身份');
 await page.reload();await header.waitFor();assert.equal(await header.locator('[data-custom-column]').count(),2);
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'内容',exact:true}).click();await page.locator('h3:visible').filter({hasText:'比赛名称长文本'}).first().click();await page.getByText('字段与排版',{exact:true}).first().click();const toggle=page.getByRole('switch',{name:'在简历中显示内容－中'});await toggle.scrollIntoViewIfNeeded();const box=await toggle.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=390);
});
