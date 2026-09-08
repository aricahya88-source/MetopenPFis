import { cn } from '@/lib/utils';
export default function GlassCard({children,className=''}:{children:React.ReactNode;className?:string}) {
  return <section className={cn('glass-card',className)}>{children}</section>;
}
