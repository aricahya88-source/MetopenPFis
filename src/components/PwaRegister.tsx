'use client';
import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshing=false;
    const onControllerChange=()=>{
      if(refreshing) return;
      refreshing=true;
      // Only once per tab. This switches users from the old cache-first worker
      // to the new network-first worker without an endless reload loop.
      if(sessionStorage.getItem('lms-sw-v17-reloaded')!=='1'){
        sessionStorage.setItem('lms-sw-v17-reloaded','1');
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange',onControllerChange);
    navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'})
      .then(reg=>reg.update())
      .catch(()=>{});

    return ()=>navigator.serviceWorker.removeEventListener('controllerchange',onControllerChange);
  },[]);
  return null;
}
