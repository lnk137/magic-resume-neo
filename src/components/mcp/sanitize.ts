/** Keep AI-authored rich text within the editor's supported, inert HTML vocabulary. */
export function sanitizeMcpRichText(html: string): string {
  const template = document.createElement('template');
  template.innerHTML = html;
  const allowed = new Set(['P','DIV','SPAN','BR','UL','OL','LI','STRONG','B','EM','I','U','S','H1','H2','H3','H4','BLOCKQUOTE','CODE','PRE','A','MARK']);
  for (const element of [...template.content.querySelectorAll('*')].reverse()) {
    if (!allowed.has(element.tagName)) { element.replaceWith(...element.childNodes); continue; }
    const style = (element as HTMLElement).style;
    const retained: Record<string,string> = {};
    for (const name of ['color','background-color','text-align','text-decoration','font-weight','font-style','font-size']) {
      const value = style.getPropertyValue(name);
      if (/^(#[\da-f]{3,8}|rgba?\([\d\s.,%]+\)|left|center|right|justify|bold|normal|italic|underline|line-through)$/i.test(value)) retained[name] = value;
    }
    const href = element.getAttribute('href') || '';
    const fontSize = style.getPropertyValue('font-size');
    if (/^\d+(?:\.\d+)?(?:px|pt|em|rem)$/.test(fontSize) && parseFloat(fontSize) <= 200) retained['font-size'] = fontSize;
    const markColor = element.getAttribute('data-color') || ''; 
    for (const attr of [...element.attributes]) element.removeAttribute(attr.name);
    for (const [name,value] of Object.entries(retained)) style.setProperty(name,value);
    if (element.tagName === 'MARK' && /^#[\da-f]{6}$/i.test(markColor)) element.setAttribute('data-color', markColor);
    if (element.tagName === 'A' && /^(https?:\/\/|mailto:|tel:|#)/i.test(href)) { element.setAttribute('href',href); element.setAttribute('rel','noopener noreferrer'); }
  }
  return template.innerHTML;
}

export function sanitizeResumeRichText<T extends Record<string, any>>(resume: T, previous?: Record<string, any>): T {
  const result = structuredClone(resume);
  for (const field of ['skillContent','selfEvaluationContent']) if (typeof result[field] === 'string' && result[field] !== previous?.[field]) (result as Record<string,any>)[field] = sanitizeMcpRichText(result[field]);
  const lists: [Record<string,any>[], Record<string,any>[]][] = ['education','experience','projects','publications'].map(key => [result[key] || [], previous?.[key] || []]);
  for (const [section, entries] of Object.entries(result.customData || {})) lists.push([entries as Record<string,any>[], previous?.customData?.[section] || []]);
  for (const [entries, oldEntries] of lists) for (const item of entries) {
    const old = oldEntries.find(entry => entry.id === item.id);
    for (const field of ['description','details']) if (typeof item[field] === 'string' && item[field] !== old?.[field]) item[field] = sanitizeMcpRichText(item[field]);
  }
  return result;
}
