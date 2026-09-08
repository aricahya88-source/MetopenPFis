'use client';
import DOMPurify from 'dompurify';

function basic(html:string) {
  return String(html||'')
    .replace(/<script[\s\S]*?<\/script>/gi,'')
    .replace(/<style[\s\S]*?<\/style>/gi,'')
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi,'')
    .replace(/javascript:/gi,'');
}

export default function RichHtml({html,className='rich-html'}:{html:string;className?:string}) {
  const pre=basic(html);
  const clean = typeof window === 'undefined' ? pre : DOMPurify.sanitize(pre, {
    ADD_ATTR:['dir','target','rel','class'],
    ADD_TAGS:['iframe']
  });
  return <div className={className} dir="auto" suppressHydrationWarning dangerouslySetInnerHTML={{__html:clean}} />;
}
