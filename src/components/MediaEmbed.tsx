'use client';

function youtubeId(url:string) {
  try {
    const u=new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop() || '';
  } catch {}
  return '';
}

function drivePreview(url:string) {
  try {
    const u=new URL(url);
    if (!u.hostname.includes('drive.google.com')) return '';
    const match=u.pathname.match(/\/file\/d\/([^/]+)/);
    const id=match?.[1] || u.searchParams.get('id') || '';
    return id ? `https://drive.google.com/file/d/${id}/preview` : '';
  } catch { return ''; }
}

export default function MediaEmbed({url}:{url?:string}) {
  if (!url) return null;
  const lower=url.toLowerCase();
  const yt=youtubeId(url);
  if (yt) return <div className="media-embed"><iframe src={`https://www.youtube-nocookie.com/embed/${yt}`} title="Video materi" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/></div>;
  const drive=drivePreview(url);
  if (drive) return <div className="media-embed drive"><iframe src={drive} title="Media Google Drive" allow="autoplay" allowFullScreen/></div>;
  if (/\.(mp3|wav|ogg|m4a)(\?|$)/.test(lower)) return <audio className="media-player" controls preload="metadata" src={url}/>;
  if (/\.(mp4|webm|mov)(\?|$)/.test(lower)) return <video className="media-player" controls preload="metadata" src={url}/>;
  return <a className="button soft" href={url} target="_blank" rel="noreferrer">Buka sumber materi ↗</a>;
}
