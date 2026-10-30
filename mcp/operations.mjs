/** Shared, side-effect-free resume operations. All edits are atomic in the browser. */
const forbidden = new Set(['__proto__', 'constructor', 'prototype', 'githubKey']);
const builtin = new Set(['basic', 'education', 'experience', 'projects', 'publications', 'skill', 'skills', 'selfEvaluation', 'certificates']);
const lists = new Set(['education', 'experience', 'projects', 'publications', 'certificates']);
const rootFields = new Set(['title', 'basic', 'globalSettings', 'skillContent', 'selfEvaluationContent', 'templateId']);
export const actions = ['resume_create', 'resume_duplicate', 'resume_delete', 'resume_update', 'resume_import', 'module_create', 'module_update', 'module_delete', 'module_reorder', 'item_create', 'item_update', 'item_delete', 'item_reorder'];
export function checkJson(value, depth = 0) {
  if (depth > 30) throw new Error('Data is too deeply nested');
  if (typeof value === 'string') {
    if (value.length > 2_000_000) throw new Error('Text exceeds size limit');
    if (/<\s*(script|iframe|object|embed|svg|math|style|link|meta|form)\b|\bon\w+\s*=|(?:javascript|vbscript)\s*:|data\s*:\s*text\/html/i.test(value)) throw new Error('Unsafe HTML or URL rejected');
  } else if (Array.isArray(value)) value.forEach(v => checkJson(v, depth + 1));
  else if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      if (forbidden.has(key)) throw new Error(`Protected field: ${key}`);
      checkJson(entry, depth + 1);
    }
  } else if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Number must be finite');
}
function object(value, label = 'data') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value;
}
function id(value) {
  if (typeof value !== 'string' || !/^[\w-]{1,150}$/.test(value) || forbidden.has(value)) throw new Error('Invalid id');
  return value;
}
function text(value, label) { if (typeof value !== 'string') throw new Error(`${label} must be text`); return value; }
function deepMerge(original, patch) {
  const next = { ...original };
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) delete next[key];
    else if (value && typeof value === 'object' && !Array.isArray(value)) next[key] = deepMerge(next[key] || {}, value);
    else next[key] = value;
  }
  return next;
}
function reorder(items, ids) {
  if (!Array.isArray(ids) || ids.length !== items.length || new Set(ids).size !== ids.length || ids.some(key => !items.some(item => item.id === key))) throw new Error('Order must contain every existing id exactly once');
  return ids.map(key => items.find(item => item.id === key));
}
function checkFields(entry, required, optional = []) {
  for (const field of required) text(entry[field], field);
  for (const field of optional) if (entry[field] !== undefined) text(entry[field], field);
  if (entry.visible !== undefined && typeof entry.visible !== 'boolean') throw new Error('visible must be boolean');
}
export function validateResume(resume) {
  object(resume); id(resume.id); text(resume.title, 'title'); object(resume.basic, 'basic'); object(resume.globalSettings, 'globalSettings'); object(resume.customData, 'customData');
  for (const key of ['name', 'title', 'email', 'phone', 'location']) text(resume.basic[key], `basic.${key}`);
  for (const key of ['education', 'experience', 'projects', 'certificates', 'menuSections']) if (!Array.isArray(resume[key])) throw new Error(`${key} must be an array`);
  const allLists = [...[...lists].map(key => resume[key] || []), resume.menuSections, ...Object.values(resume.customData)];
  for (const entries of allLists) {
    if (!Array.isArray(entries)) throw new Error('Module content must be an array');
    const seen = new Set();
    for (const entry of entries) { object(entry); id(entry.id); if (seen.has(entry.id)) throw new Error('Duplicate item id'); seen.add(entry.id); }
  }
  if(resume.activeSection !== undefined) text(resume.activeSection,'activeSection');
  if(resume.draggingProjectId !== undefined && resume.draggingProjectId !== null) text(resume.draggingProjectId,'draggingProjectId');
  text(resume.skillContent, 'skillContent'); text(resume.selfEvaluationContent, 'selfEvaluationContent');
  for (const entry of resume.education) checkFields(entry, ['school','major','degree','startDate','endDate'], ['gpa','description','logo']);
  for (const entry of resume.experience) checkFields(entry, ['company','position','date','details'], ['logo']);
  for (const entry of resume.projects) checkFields(entry, ['name','role','date','description'], ['link','linkLabel']);
  for (const entry of resume.publications || []) checkFields(entry, ['title','authors','highlightedAuthor','venue','date','status','link','description']);
  for (const entry of resume.certificates) { checkFields(entry,['url']); if(typeof entry.width !== 'number' || entry.width < 1 || entry.width > 100) throw new Error('Certificate width must be 1–100'); }
  for (const entries of Object.values(resume.customData)) for (const entry of entries) {
    checkFields(entry,['title','subtitle','dateRange','description']);
    if (entry.hiddenFields !== undefined && (!Array.isArray(entry.hiddenFields) || entry.hiddenFields.some(f=>!['title','subtitle','dateRange','description'].includes(f)))) throw new Error('Invalid hiddenFields');
    if (entry.fieldBold !== undefined) for (const [field, bold] of Object.entries(object(entry.fieldBold))) { if (!['title','subtitle','dateRange'].includes(field) || typeof bold !== 'boolean') throw new Error('Invalid fieldBold'); }
    if (entry.fieldLabels !== undefined) for(const [field,label] of Object.entries(object(entry.fieldLabels))) { if(!['title','subtitle','dateRange','description'].includes(field)) throw new Error('Invalid field label'); text(label,'field label'); }
    if (entry.alignment !== undefined && !['left','center','right'].includes(entry.alignment)) throw new Error('Invalid alignment');
  }
  for (const entry of [...resume.projects,...(resume.publications || [])]) if(entry.link && !/^(https?:\/\/|mailto:|tel:|#)/i.test(entry.link)) throw new Error('Links must use http, https, mailto or tel');
  for (const section of resume.menuSections) { text(section.title, 'module.title'); if(section.icon !== undefined) text(section.icon,'module.icon'); if (typeof section.enabled !== 'boolean') throw new Error('Module enabled must be boolean'); }
  for (const field of ['birthDate','employementStatus','photo','githubUseName']) if (resume.basic[field] !== undefined) text(resume.basic[field], 'basic.'+field);
  if (resume.basic.githubContributionsVisible !== undefined && typeof resume.basic.githubContributionsVisible !== 'boolean') throw new Error('githubContributionsVisible must be boolean');
  if (resume.basic.layout !== undefined && !['left','center','right'].includes(resume.basic.layout)) throw new Error('Invalid basic layout');
  if (resume.basic.icons !== undefined) for (const value of Object.values(object(resume.basic.icons))) text(value, 'icon');
  for (const key of ['customFields','fieldOrder']) if (resume.basic[key] !== undefined) {
    if (!Array.isArray(resume.basic[key])) throw new Error(key+' must be an array');
    for (const field of resume.basic[key]) { object(field); id(field.id); text(field.label,'label'); if (key==='customFields') text(field.value,'value'); else { text(field.key,'key'); if(!['name','title','email','phone','location','birthDate','employementStatus','githubUseName'].includes(field.key)) throw new Error('fieldOrder key must be a scalar basic field'); if(field.type !== undefined && !['date','textarea','text','editor'].includes(field.type)) throw new Error('Invalid basic field type'); } for(const prop of ['visible','custom','displayLabel']) if(field[prop] !== undefined && typeof field[prop] !== 'boolean') throw new Error(prop+' must be boolean'); }
  }
  const photos = [resume.basic.photoConfig,...resume.education.map(e=>e.logoConfig),...resume.experience.map(e=>e.logoConfig)].filter(v=>v!==undefined);
  for(const photo of photos) {
    object(photo);
    for(const key of ['width','height']) if(typeof photo[key] !== 'number' || photo[key]<1 || photo[key]>2000) throw new Error('Invalid image size');
    if(!['1:1','4:3','3:4','16:9','custom'].includes(photo.aspectRatio)) throw new Error('Invalid image aspectRatio');
    if(!['none','medium','full','custom'].includes(photo.borderRadius)) throw new Error('Invalid borderRadius');
    if(typeof photo.customBorderRadius !== 'number' || photo.customBorderRadius<0 || photo.customBorderRadius>2000) throw new Error('Invalid customBorderRadius');
    if(photo.visible !== undefined && typeof photo.visible !== 'boolean') throw new Error('Image visible must be boolean');
  }
  if(resume.templateId !== undefined && resume.templateId !== null) text(resume.templateId,'templateId');
  const settings = resume.globalSettings;
  const numeric = ['baseFontSize','pagePadding','paragraphSpacing','lineHeight','sectionSpacing','headerSize','subheaderSize'];
  const booleans = ['useIconMode','centerSubtitle','flexibleHeaderLayout','autoOnePage'];
  const knownSettings = new Set([...numeric,...booleans,'textColors','fieldColors','themeColor','fontFamily','dateFormat']);
  for(const [key,value] of Object.entries(settings)) {
    if(!knownSettings.has(key)) throw new Error('Unknown style setting: '+key);
    if(booleans.includes(key) && typeof value !== 'boolean') throw new Error(key+' must be boolean');
    if(['themeColor','fontFamily','dateFormat'].includes(key)) text(value,key);
    if(key==='dateFormat' && !['YYYY/MM','YYYY.MM','YYYY-MM','MM/YYYY','short-month'].includes(value)) throw new Error('Invalid dateFormat');
    if(key==='themeColor' && !/^#[0-9a-f]{6}$/i.test(value)) throw new Error('themeColor must be #RRGGBB');
  }
  for (const [key, value] of Object.entries(settings)) {
    if (['textColors', 'fieldColors'].includes(key)) { object(value); if(key==='textColors' && Object.keys(value).some(k=>!['body','name','title','subtitle','date','section'].includes(k))) throw new Error('Unknown text color role'); for (const color of Object.values(value)) if (color !== '' && !/^#[0-9a-f]{6}$/i.test(color)) throw new Error('Colors must be #RRGGBB'); }
    if (['baseFontSize', 'pagePadding', 'paragraphSpacing', 'lineHeight', 'sectionSpacing', 'headerSize', 'subheaderSize'].includes(key) && (typeof value !== 'number' || value < 0 || value > 200)) throw new Error(`Invalid style value: ${key}`);
  }
  checkJson(resume);
  return resume;
}
/** @param {Record<string, any>} resumes @param {string} action @param {any} args @param {any} blank @param {string[]} templateIds */
export function applyOperation(resumes, action, args, blank, templateIds = []) {
  if (!actions.includes(action)) throw new Error('Unknown action');
  object(args); checkJson(args);
  const next = structuredClone(resumes);
  const now = new Date().toISOString();
  const newId = () => globalThis.crypto.randomUUID();
  const resumeId = args.resume_id;
  const existing = resumeId ? next[id(resumeId)] : null;
  let target = existing, resultId = resumeId;
  if (['resume_create', 'resume_import', 'resume_duplicate'].includes(action)) {
    if (action === 'resume_duplicate' && !existing) throw new Error('Resume not found');
    const source = action === 'resume_import' ? object(args.data) : action === 'resume_duplicate' ? existing : blank;
    target = structuredClone(source); target.id = newId(); target.title = args.title || target.title || '新建简历'; target.createdAt = now; target.updatedAt = now;
    if(typeof target.activeSection !== 'string') { if(target.activeSection !== undefined) throw new Error('activeSection must be text'); target.activeSection='basic'; }
    if(!target.menuSections?.some(s=>s.id===target.activeSection)) target.activeSection='basic';
    target.draggingProjectId = null;
    target.basic = { ...target.basic }; delete target.basic.githubKey;
    resultId = target.id; next[resultId] = target;
  } else {
    if (!existing) throw new Error('Resume not found');
    if (action === 'resume_delete') { delete next[resumeId]; return { resumes: next, resume_id: resumeId, deleted: true }; }
    if (action === 'resume_update') {
      object(args.data);
      for (const key of Object.keys(args.data)) if (!rootFields.has(key)) throw new Error(`Use module/item tools for ${key}`);
      target = deepMerge(target, args.data); next[resumeId] = target;
    }
    if (action.startsWith('module_')) {
      const sectionId = action === 'module_create' ? (args.module_id || `custom-${newId()}`) : args.module_id;
      const section = target.menuSections.find(s => s.id === sectionId);
      if (action === 'module_create') {
        if(args.module_id && (!builtin.has(args.module_id) || args.module_id==='basic' || args.module_id==='skill')) throw new Error('Invalid built-in module id');
        if(section) throw new Error('Module already exists');
        object(args.data); const title = text(args.data.title, 'module.title');
        target.menuSections.push({ id: sectionId, title, icon: 'ri-file-text-line', enabled: true, order: target.menuSections.length }); if(!args.module_id) target.customData[sectionId] = []; resultId = sectionId;
      } else if (action === 'module_reorder') target.menuSections = reorder(target.menuSections, args.ids).map((s, order) => ({ ...s, order }));
      else {
        if (!section) throw new Error('Module not found');
        if (action === 'module_update') {
          object(args.data); for (const key of Object.keys(args.data)) if (!['title','icon','enabled'].includes(key)) throw new Error(`Unsupported module field: ${key}`);
          Object.assign(section, args.data);
        } else {
          if (!Object.hasOwn(target.customData, sectionId) || builtin.has(sectionId)) throw new Error('Built-in modules can be hidden, not deleted');
          target.menuSections = target.menuSections.filter(s => s.id !== sectionId); delete target.customData[sectionId]; if(target.activeSection===sectionId) target.activeSection='basic';
        }
      }
    }
    if (action.startsWith('item_')) {
      const sectionId = id(args.module_id);
      const custom = Object.hasOwn(target.customData, sectionId);
      if (!custom && !lists.has(sectionId)) throw new Error('Module has no list items; use resume_update for rich-text sections');
      if(!custom && !target.menuSections.some(s=>s.id===sectionId)) target.menuSections.push({id:sectionId,title:({education:'教育经历',experience:'工作经历',projects:'项目经历',publications:'学术发表',certificates:'证书'})[sectionId],icon:'ri-file-text-line',enabled:true,order:target.menuSections.length});
      const entries = custom ? target.customData[sectionId] : (target[sectionId] ||= []);
      const itemId = action === 'item_create' ? newId() : args.item_id;
      const index = entries.findIndex(item => item.id === itemId);
      if (action === 'item_reorder') {
        const reordered = reorder(entries, args.ids); if (custom) target.customData[sectionId] = reordered; else target[sectionId] = reordered;
      } else if (action === 'item_create') {
        object(args.data);
        const defaults = custom ? { title:'',subtitle:'',dateRange:'',description:'',visible:true } : sectionId === 'education' ? {school:'',major:'',degree:'',startDate:'',endDate:'',visible:true} : sectionId === 'experience' ? {company:'',position:'',date:'',details:'',visible:true} : sectionId === 'projects' ? {name:'',role:'',date:'',description:'',visible:true} : sectionId === 'publications' ? {title:'',authors:'',highlightedAuthor:'',venue:'',date:'',status:'',link:'',description:'',visible:true} : {url:'',width:100};
        entries.push({ ...defaults, ...args.data, id:itemId }); resultId = itemId;
      } else {
        if (index < 0) throw new Error('Item not found');
        if (action === 'item_delete') entries.splice(index, 1);
        else { object(args.data); if (Object.hasOwn(args.data, 'id')) throw new Error('Item id is immutable'); entries[index] = deepMerge(entries[index], args.data); }
      }
    }
    target.updatedAt = now;
  }
  if (target.templateId && templateIds.length && !templateIds.includes(target.templateId)) throw new Error('Unknown template; use resume_schema to list templates');
  validateResume(target);
  return { resumes: next, resume_id: target.id, result_id: resultId };
}
export function publicResumes(resumes) {
  const copy = structuredClone(resumes);
  for (const resume of Object.values(copy)) { if (resume.basic) delete resume.basic.githubKey; }
  return copy;
}
