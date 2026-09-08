'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, Square, RotateCcw, Volume2, UserRound, Gauge } from 'lucide-react';
import { stripHtml } from '@/lib/utils';

const VOICE_KEY='lms-indonesian-voice-uri';
const VOICE_EVENT='lms-indonesian-voice-change';

function arabicRatio(text:string){const chars=[...text].filter(c=>/\S/.test(c));return chars.length?chars.filter(c=>/[\u0600-\u06FF]/.test(c)).length/chars.length:0;}
function speechChunks(text:string,max=720){
  const units=text.split(/(?<=[.!?؟])\s+|\n+/).map(s=>s.trim()).filter(Boolean),out:string[]=[];
  for(const unit of units){if(unit.length<=max){out.push(unit);continue;}const words=unit.split(/\s+/);let chunk='';for(const word of words){const next=(chunk+' '+word).trim();if(next.length>max&&chunk){out.push(chunk);chunk=word}else chunk=next}if(chunk)out.push(chunk)}return out;
}
function isIndonesian(v:SpeechSynthesisVoice){return /^id(?:-|$)/i.test(v.lang)||/indonesia/i.test(`${v.name} ${v.lang}`);}
function isArabic(v:SpeechSynthesisVoice){return /^ar(?:-|$)/i.test(v.lang);}

export default function SpeechPlayer({html,label='Dengarkan Materi',compact=false}:{html:string;label?:string;compact?:boolean}){
  const text=useMemo(()=>stripHtml(html),[html]);
  const [supported,setSupported]=useState(true);
  const [playing,setPlaying]=useState(false);
  const [paused,setPaused]=useState(false);
  const [rate,setRate]=useState(0.95);
  const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri,setSelectedVoiceUri]=useState('');
  const stopped=useRef(false);

  useEffect(()=>{
    if(!('speechSynthesis' in window)){setSupported(false);return;}
    const load=()=>setVoices(window.speechSynthesis.getVoices());
    const syncVoice=()=>setSelectedVoiceUri(localStorage.getItem(VOICE_KEY)||'');
    load();syncVoice();
    window.speechSynthesis.addEventListener?.('voiceschanged',load);
    window.addEventListener(VOICE_EVENT,syncVoice);
    return()=>{
      window.speechSynthesis.removeEventListener?.('voiceschanged',load);
      window.removeEventListener(VOICE_EVENT,syncVoice);
      window.speechSynthesis.cancel();
    };
  },[]);

  const idVoices=useMemo(()=>voices.filter(isIndonesian).sort((a,b)=>a.name.localeCompare(b.name)),[voices]);
  const chosenIdVoice=useMemo(()=>idVoices.find(v=>v.voiceURI===selectedVoiceUri)||idVoices[0], [idVoices,selectedVoiceUri]);

  const selectVoice=(uri:string)=>{
    setSelectedVoiceUri(uri);
    if(uri)localStorage.setItem(VOICE_KEY,uri); else localStorage.removeItem(VOICE_KEY);
    window.dispatchEvent(new Event(VOICE_EVENT));
  };

  const pickVoice=(lang:string)=>{
    if(lang.startsWith('id')) return chosenIdVoice||voices.find(v=>v.default)||voices[0];
    if(lang.startsWith('ar')) return voices.find(isArabic)||voices.find(v=>v.default)||voices[0];
    return voices.find(v=>v.lang.toLowerCase().startsWith(lang.split('-')[0].toLowerCase()))||voices.find(v=>v.default)||voices[0];
  };

  const play=()=>{
    if(!supported||!text)return;
    window.speechSynthesis.cancel();stopped.current=false;setPlaying(true);setPaused(false);
    const chunks=speechChunks(text);
    const speakAt=(i:number)=>{
      if(stopped.current||i>=chunks.length){setPlaying(false);setPaused(false);return;}
      const chunk=chunks[i],lang=arabicRatio(chunk)>0.18?'ar-SA':'id-ID',u=new SpeechSynthesisUtterance(chunk);
      u.lang=lang;u.rate=rate;
      const voice=pickVoice(lang);if(voice)u.voice=voice;
      u.onend=()=>speakAt(i+1);u.onerror=()=>speakAt(i+1);
      window.speechSynthesis.speak(u);
    };
    speakAt(0);
  };
  const pause=()=>{if(!playing)return;if(paused){window.speechSynthesis.resume();setPaused(false)}else{window.speechSynthesis.pause();setPaused(true)}};
  const stop=()=>{stopped.current=true;window.speechSynthesis.cancel();setPlaying(false);setPaused(false)};

  if(!supported)return compact?null:<div className="speech-bar">Text-to-Speech tidak didukung browser ini.</div>;
  if(compact)return <div className="speech-mini" title="Dibacakan dengan suara Indonesia pilihan Anda; teks Arab memakai suara Arab bila tersedia.">
    <button className="button soft compact" onClick={play}><Play size={14}/>{label}</button>
    {playing&&<><button className="icon-button tiny" onClick={pause} title={paused?'Lanjut':'Jeda'}>{paused?<RotateCcw/>:<Pause/>}</button><button className="icon-button tiny" onClick={stop} title="Stop"><Square/></button></>}
  </div>;

  return <div className="speech-bar glass-subtle speech-player-rich">
    <div className="speech-title"><Volume2 size={18}/><div><strong>{label}</strong><small>Indonesia + Arab otomatis</small></div></div>
    <div className="speech-actions"><button className="icon-button" onClick={play} title="Putar"><Play size={17}/></button><button className="icon-button" onClick={pause} disabled={!playing} title={paused?'Lanjut':'Jeda'}>{paused?<RotateCcw size={17}/>:<Pause size={17}/>}</button><button className="icon-button" onClick={stop} disabled={!playing} title="Stop"><Square size={16}/></button></div>
    <label className="voice-control"><span><UserRound/>Suara Indonesia</span><select value={selectedVoiceUri} onChange={e=>selectVoice(e.target.value)} disabled={!idVoices.length}>
      {!idVoices.length?<option value="">Suara Indonesia perangkat tidak ditemukan</option>:<><option value="">Otomatis — {idVoices[0]?.name}</option>{idVoices.map(v=><option value={v.voiceURI} key={v.voiceURI}>{v.name} ({v.lang})</option>)}</>}
    </select></label>
    <label className="rate-control"><span><Gauge/>Kecepatan</span><input type="range" min="0.7" max="1.35" step="0.05" value={rate} onChange={e=>setRate(Number(e.target.value))}/><strong>{rate.toFixed(2)}×</strong></label>
  </div>;
}
