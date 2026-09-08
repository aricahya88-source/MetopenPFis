'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
};

/**
 * WYSIWYG ringan berbasis contentEditable.
 * Tidak membuat instance TipTap per field, sehingga aman dipakai 4–8 editor sekaligus.
 * Fitur inti: heading/paragraf, bold, italic, underline, daftar, alignment, link, tabel, undo/redo.
 */
export default function LightRichTextEditor({ value, onChange, placeholder='Tulis jawaban di sini…', minHeight=150 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || focused) return;
    if (el.innerHTML !== (value || '')) el.innerHTML = value || '';
    setEmpty(!(el.textContent || '').trim() && !el.querySelector('img,table,ul,ol'));
  }, [value, focused]);

  const emit = () => {
    const el = ref.current;
    if (!el) return;
    const html = el.innerHTML;
    setEmpty(!(el.textContent || '').trim() && !el.querySelector('img,table,ul,ol'));
    onChange(html === '<br>' ? '' : html);
  };

  const cmd = (name: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(name, false, arg);
    emit();
  };

  const addLink = () => {
    const url = window.prompt('Masukkan URL tautan:');
    if (!url) return;
    cmd('createLink', url);
  };

  const insertTable = () => {
    const rows = Math.max(1, Math.min(12, Number(window.prompt('Jumlah baris tabel:', '5')) || 5));
    const cols = Math.max(1, Math.min(8, Number(window.prompt('Jumlah kolom tabel:', '4')) || 4));
    let html = '<table><tbody>';
    for (let r=0; r<rows; r++) {
      html += '<tr>';
      for (let c=0; c<cols; c++) html += '<td><br></td>';
      html += '</tr>';
    }
    html += '</tbody></table><p><br></p>';
    cmd('insertHTML', html);
  };

  const button = (label:string, title:string, action:()=>void) => (
    <button type="button" title={title} onMouseDown={e=>e.preventDefault()} onClick={action}
      style={{border:'1px solid var(--line,#d9dfdc)',background:'#fff',borderRadius:8,padding:'5px 8px',fontWeight:700,cursor:'pointer',minWidth:30}}>{label}</button>
  );

  return <div style={{border:'1px solid var(--line,#d9dfdc)',borderRadius:14,overflow:'hidden',background:'#fff'}}>
    <div style={{display:'flex',gap:5,flexWrap:'wrap',padding:8,borderBottom:'1px solid var(--line,#e4e8e6)',background:'#f7f8f7'}}>
      <select aria-label="Format teks" defaultValue="p" onChange={e=>cmd('formatBlock', e.target.value)}
        style={{border:'1px solid var(--line,#d9dfdc)',borderRadius:8,padding:'5px 7px',background:'#fff'}}>
        <option value="p">Paragraf</option><option value="h3">Judul kecil</option><option value="h4">Subjudul</option>
      </select>
      {button('B','Tebal',()=>cmd('bold'))}
      {button('I','Miring',()=>cmd('italic'))}
      {button('U','Garis bawah',()=>cmd('underline'))}
      {button('•','Daftar poin',()=>cmd('insertUnorderedList'))}
      {button('1.','Daftar nomor',()=>cmd('insertOrderedList'))}
      {button('L','Rata kiri',()=>cmd('justifyLeft'))}
      {button('C','Rata tengah',()=>cmd('justifyCenter'))}
      {button('R','Rata kanan',()=>cmd('justifyRight'))}
      {button('J','Justify',()=>cmd('justifyFull'))}
      {button('🔗','Tautan',addLink)}
      {button('▦','Sisipkan tabel',insertTable)}
      {button('↶','Undo',()=>cmd('undo'))}
      {button('↷','Redo',()=>cmd('redo'))}
      {button('Tx','Hapus format',()=>cmd('removeFormat'))}
    </div>
    <div style={{position:'relative'}}>
      {empty && !focused ? <div style={{position:'absolute',left:14,top:12,color:'#8a918d',pointerEvents:'none'}}>{placeholder}</div> : null}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        dir="auto"
        onInput={emit}
        onBlur={()=>{setFocused(false);emit();}}
        onFocus={()=>setFocused(true)}
        style={{minHeight,padding:'12px 14px',outline:'none',lineHeight:1.65,overflowX:'auto'}}
      />
    </div>
  </div>;
}
