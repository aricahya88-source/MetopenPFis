'use client';
import { useMemo, useState } from 'react';
import type { Material } from '@/lib/types';
import GlassCard from './GlassCard';
import RichHtml from './RichHtml';
import SpeechPlayer from './SpeechPlayer';
import MediaEmbed from './MediaEmbed';
import {
  BookOpenText, ChevronDown, ChevronUp, Headphones, Clock3, Compass,
  Target, MessageCircleQuestion, FlaskConical, ClipboardPenLine, Lightbulb,
  ListTree, Volume2
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { stripHtml } from '@/lib/utils';

type LearningSection={id:string;kind:string;label:string;html:string;Icon:LucideIcon};
const SECTION_META:Record<string,{label:string;Icon:LucideIcon}>={
  overview:{label:'Orientasi & Keterkaitan RPS',Icon:Compass},
  objectives:{label:'Tujuan Belajar',Icon:Target},
  prompt:{label:'Pertanyaan Pemantik',Icon:MessageCircleQuestion},
  core:{label:'Materi Inti',Icon:BookOpenText},
  activity:{label:'Aktivitas Belajar',Icon:FlaskConical},
  worksheet:{label:'Lembar Kerja / Praktik',Icon:ClipboardPenLine},
  reflection:{label:'Refleksi',Icon:Lightbulb}
};

function cleanHero(html:string){return String(html||'').replace(/<header class="material-hero">[\s\S]*?<\/header>/i,'').trim();}
function splitSections(html:string):LearningSection[]{
  const body=cleanHero(html); const rows:LearningSection[]=[];
  const re=/<section\s+data-learning-section="([^"]+)"[^>]*>([\s\S]*?)<\/section>/gi; let m:RegExpExecArray|null;
  while((m=re.exec(body))){const kind=m[1];const meta=SECTION_META[kind]||{label:kind,Icon:BookOpenText};rows.push({id:`s${rows.length+1}`,kind,label:meta.label,html:m[2],Icon:meta.Icon});}
  if(rows.length)return rows;
  const parts=body.split(/(?=<h[23][^>]*>)/i).filter(x=>x.trim());
  return parts.map((x,i)=>({id:`s${i+1}`,kind:'core',label:i?'Materi Inti':'Orientasi',html:x,Icon:BookOpenText}));
}

export default function MaterialView({material}:{material:Material}) {
  const sections=useMemo(()=>splitSections(material.content_html),[material.content_html]);
  const [open,setOpen]=useState<Record<string,boolean>>({});
  const words=stripHtml(material.content_html).split(/\s+/).filter(Boolean).length;
  const minutes=Math.max(1,Math.round(words/180));
  return <GlassCard className="material-card reading-surface">
    <div className="material-card-head">
      <div className="icon-bubble teal"><BookOpenText/></div>
      <div className="grow"><span className="eyebrow">MATERI {material.material_no}</span><h2>{material.title}</h2><div className="row wrap gap material-meta"><span><Clock3/> ±{minutes} menit baca</span><span><Headphones/> Text-to-Speech</span><span><ListTree/> {sections.length} bagian</span></div></div>
    </div>

    <SpeechPlayer html={material.content_html} label="Dengarkan seluruh materi"/>

    <nav className="material-outline" aria-label={`Daftar isi Materi ${material.material_no}`}>
      {sections.map(({id,kind,label,Icon})=><a key={id} href={`#mat-${material.material_no}-${kind}`} className={`outline-chip ${kind}`}><Icon/>{label}</a>)}
    </nav>

    <div className="material-sections">
      {sections.map((section,i)=>{
        const {kind,label,html,Icon}=section; const isOpen=open[section.id]!==false;
        return <section className={`material-section section-${kind}`} id={`mat-${material.material_no}-${kind}`} key={section.id}>
          <div className="material-section-toolbar">
            <span className={`section-icon section-icon-${kind}`}><Icon/></span>
            <div className="section-heading"><small>{String(i+1).padStart(2,'0')}</small><strong>{label}</strong></div>
            <SpeechPlayer html={html} label="Dengarkan" compact/>
            <button className="icon-button" title={isOpen?'Tutup bagian':'Buka bagian'} onClick={()=>setOpen(v=>({...v,[section.id]:!isOpen}))}>{isOpen?<ChevronUp/>:<ChevronDown/>}</button>
          </div>
          {isOpen&&<RichHtml html={html} className="rich-html material-html"/>}
        </section>;
      })}
    </div>

    <div className="material-tts-note"><Volume2/><span>Suara pembaca Bahasa Indonesia dapat dipilih pada pemutar di atas. Teks Arab otomatis menggunakan suara Arab jika tersedia di perangkat.</span></div>
    <MediaEmbed url={material.resource_url}/>
  </GlassCard>;
}
