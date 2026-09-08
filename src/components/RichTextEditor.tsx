'use client';

import { useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { Extension } from '@tiptap/core';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Highlighter, List, ListOrdered,
  Quote, Undo2, Redo2, Link2, ImagePlus, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Table2, Rows3, Columns3, Trash2, Code2, Eraser, Pilcrow, ListChecks
} from 'lucide-react';
import { api, fileToBase64 } from '@/lib/api';

const TextDirection = Extension.create({
  name:'textDirection',
  addGlobalAttributes() {
    return [{
      types:['paragraph','heading'],
      attributes:{
        dir:{
          default:null,
          parseHTML:element=>element.getAttribute('dir'),
          renderHTML:attributes=>attributes.dir?{dir:attributes.dir}:{}
        }
      }
    }];
  }
});

function TButton({title,onClick,active=false,children}:{title:string;onClick:()=>void;active?:boolean;children:React.ReactNode}) {
  return <button type="button" title={title} className={active?'rt-btn active':'rt-btn'} onClick={onClick}>{children}</button>;
}

export default function RichTextEditor({
  value,onChange,placeholder='Tulis konten di sini...',minHeight=220
}:{value:string;onChange:(html:string)=>void;placeholder?:string;minHeight?:number}) {
  const inputRef=useRef<HTMLInputElement>(null);
  const editor=useEditor({
    immediatelyRender:false,
    extensions:[
      StarterKit.configure({heading:{levels:[1,2,3,4]}}),
      Underline, Highlight.configure({multicolor:true}),
      Link.configure({openOnClick:false,autolink:true,linkOnPaste:true}),
      Image.configure({allowBase64:false}),
      TextAlign.configure({types:['heading','paragraph']}),
      Table.configure({resizable:true}),TableRow,TableHeader,TableCell,
      TaskList,TaskItem.configure({nested:true}),
      Placeholder.configure({placeholder}),
      TextDirection
    ],
    content:value || '',
    onUpdate:({editor})=>onChange(editor.getHTML()),
    editorProps:{attributes:{class:'tiptap-content',style:`min-height:${minHeight}px`}}
  });

  useEffect(()=>{
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value || '', false);
  },[value,editor]);

  if (!editor) return <div className="editor-loading">Memuat editor...</div>;

  const setLink=()=>{
    const prev=editor.getAttributes('link').href || '';
    const url=window.prompt('URL tautan:',prev);
    if (url===null) return;
    if (!url) editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({href:url,target:'_blank'}).run();
  };
  const uploadImage=async(file:File)=>{
    if (file.size > 3*1024*1024) return alert('Gambar maksimal 3 MB.');
    try {
      const base64=await fileToBase64(file);
      const data=await api<{url:string}>('uploadAsset',{file_name:file.name,file_mime:file.type,base64,category:'assets'});
      editor.chain().focus().setImage({src:data.url,alt:file.name}).run();
    } catch(err) { alert(err instanceof Error?err.message:String(err)); }
  };
  const setDir=(dir:'rtl'|'ltr')=>{
    const type=editor.isActive('heading')?'heading':'paragraph';
    editor.chain().focus().updateAttributes(type,{dir}).run();
  };

  return <div className="rich-editor-shell">
    <div className="rich-toolbar">
      <select className="rt-select" value={
        editor.isActive('heading',{level:1})?'h1':
        editor.isActive('heading',{level:2})?'h2':
        editor.isActive('heading',{level:3})?'h3':'p'
      } onChange={e=>{
        const v=e.target.value;
        if(v==='p') editor.chain().focus().setParagraph().run();
        else editor.chain().focus().toggleHeading({level:Number(v.slice(1)) as 1|2|3}).run();
      }}>
        <option value="p">Paragraf</option><option value="h1">Judul 1</option><option value="h2">Judul 2</option><option value="h3">Judul 3</option>
      </select>
      <TButton title="Bold" active={editor.isActive('bold')} onClick={()=>editor.chain().focus().toggleBold().run()}><Bold/></TButton>
      <TButton title="Italic" active={editor.isActive('italic')} onClick={()=>editor.chain().focus().toggleItalic().run()}><Italic/></TButton>
      <TButton title="Underline" active={editor.isActive('underline')} onClick={()=>editor.chain().focus().toggleUnderline().run()}><UnderlineIcon/></TButton>
      <TButton title="Coret" active={editor.isActive('strike')} onClick={()=>editor.chain().focus().toggleStrike().run()}><Strikethrough/></TButton>
      <TButton title="Highlight" active={editor.isActive('highlight')} onClick={()=>editor.chain().focus().toggleHighlight({color:'#FEF3C7'}).run()}><Highlighter/></TButton>
      <span className="rt-sep"/>
      <TButton title="Bullet list" active={editor.isActive('bulletList')} onClick={()=>editor.chain().focus().toggleBulletList().run()}><List/></TButton>
      <TButton title="Numbered list" active={editor.isActive('orderedList')} onClick={()=>editor.chain().focus().toggleOrderedList().run()}><ListOrdered/></TButton>
      <TButton title="Task list" active={editor.isActive('taskList')} onClick={()=>editor.chain().focus().toggleTaskList().run()}><ListChecks/></TButton>
      <TButton title="Quote" active={editor.isActive('blockquote')} onClick={()=>editor.chain().focus().toggleBlockquote().run()}><Quote/></TButton>
      <TButton title="Inline code" active={editor.isActive('code')} onClick={()=>editor.chain().focus().toggleCode().run()}><Code2/></TButton>
      <span className="rt-sep"/>
      <TButton title="Rata kiri" onClick={()=>editor.chain().focus().setTextAlign('left').run()}><AlignLeft/></TButton>
      <TButton title="Tengah" onClick={()=>editor.chain().focus().setTextAlign('center').run()}><AlignCenter/></TButton>
      <TButton title="Rata kanan" onClick={()=>editor.chain().focus().setTextAlign('right').run()}><AlignRight/></TButton>
      <TButton title="Justify" onClick={()=>editor.chain().focus().setTextAlign('justify').run()}><AlignJustify/></TButton>
      <TButton title="RTL Arab" onClick={()=>setDir('rtl')}><span className="rt-text">RTL</span></TButton>
      <TButton title="LTR" onClick={()=>setDir('ltr')}><span className="rt-text">LTR</span></TButton>
      <span className="rt-sep"/>
      <TButton title="Tautan" active={editor.isActive('link')} onClick={setLink}><Link2/></TButton>
      <TButton title="Upload gambar ke Drive" onClick={()=>inputRef.current?.click()}><ImagePlus/></TButton>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={e=>{const file=e.target.files?.[0];if(file)uploadImage(file);e.currentTarget.value='';}}/>
      <TButton title="Tabel 3×3" onClick={()=>editor.chain().focus().insertTable({rows:3,cols:3,withHeaderRow:true}).run()}><Table2/></TButton>
      {editor.isActive('table') && <>
        <TButton title="Tambah baris" onClick={()=>editor.chain().focus().addRowAfter().run()}><Rows3/></TButton>
        <TButton title="Tambah kolom" onClick={()=>editor.chain().focus().addColumnAfter().run()}><Columns3/></TButton>
        <TButton title="Hapus tabel" onClick={()=>editor.chain().focus().deleteTable().run()}><Trash2/></TButton>
      </>}
      <span className="rt-sep"/>
      <TButton title="Hapus format" onClick={()=>editor.chain().focus().unsetAllMarks().clearNodes().run()}><Eraser/></TButton>
      <TButton title="Undo" onClick={()=>editor.chain().focus().undo().run()}><Undo2/></TButton>
      <TButton title="Redo" onClick={()=>editor.chain().focus().redo().run()}><Redo2/></TButton>
      <span className="rt-word"><Pilcrow size={14}/>{editor.getText().trim().split(/\s+/).filter(Boolean).length} kata</span>
    </div>
    <EditorContent editor={editor}/>
  </div>;
}
