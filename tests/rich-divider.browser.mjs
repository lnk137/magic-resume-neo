import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';
const base=process.env.TEST_BASE_URL || 'http://127.0.0.1:3212';
test('rich editor inserts visible and transparent dividers without losing surrounding text', {timeout:60000}, async t=>{
 const edge='/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';const browser=await chromium.launch({executablePath:existsSync(chromium.executablePath())?undefined:edge});t.after(()=>browser.close());
 const page=await browser.newPage({viewport:{width:1280,height:900}});await page.goto(`${base}/app/dashboard`);
 const id=await page.evaluate(async()=>{const {useResumeStore}=await import('/src/store/useResumeStore.ts');const id=useResumeStore.getState().createResume(null,true);const s=useResumeStore.getState(),r=s.activeResume;s.updateResume(id,{activeSection:'custom-test',menuSections:[...r.menuSections,{id:'custom-test',title:'测试',icon:'',enabled:true,order:r.menuSections.length}],customData:{'custom-test':[{id:'entry',title:'正文',subtitle:'',dateRange:'',description:'<p>第一段</p><p>第二段</p>',visible:true}]}});return id});
 await page.goto(`${base}/app/workbench/${id}`);await page.getByRole('heading',{name:'正文'}).first().click();const editor=page.locator('.tiptap[contenteditable=true]:visible').first();await editor.waitFor();await editor.locator('p').first().click();await page.getByRole('button',{name:'插入淡分割线'}).first().click();
 let line=editor.locator('hr[data-resume-divider="line"]'); await line.first().waitFor();assert.equal(await page.locator('#resume-preview hr[data-resume-divider="line"]').count(),1);
 await editor.locator('p').last().click();await page.getByRole('button',{name:'插入透明留白'}).first().click();await editor.locator('hr[data-resume-divider="space"]').waitFor();assert.equal(await page.locator('#resume-preview hr[data-resume-divider="space"]').count(),1);
 const style=await page.locator('#resume-preview hr[data-resume-divider="space"]').evaluate(e=>({height:getComputedStyle(e).height,border:getComputedStyle(e).borderTopWidth,outline:getComputedStyle(e).outlineStyle}));assert.deepEqual(style,{height:'16px',border:'0px',outline:'none'});
 await editor.scrollIntoViewIfNeeded();await page.screenshot({path:'node_modules/.cache/rich-divider.png'});
 let payload;await page.route('**/generate-pdf',async route=>{payload=route.request().postDataJSON();await route.fulfill({status:200,contentType:'application/pdf',body:'test'});});
 const download=page.waitForEvent('download');await page.evaluate(async()=>{const {exportToPdf}=await import('/src/utils/export.ts');await exportToPdf({elementId:'resume-preview',title:'test',pagePadding:32});});await download;
 assert.match(payload.content,/data-resume-divider="line"/);assert.match(payload.content,/data-resume-divider="space"/);
 await page.reload();await page.getByRole('heading',{name:'正文'}).first().click();await editor.waitFor();await editor.locator('hr[data-resume-divider="space"]').waitFor();assert.equal(await editor.locator('hr[data-resume-divider="line"]').count(),1);assert.ok((await editor.innerText()).includes('第一段'));assert.ok((await editor.innerText()).includes('第二段'));
});
