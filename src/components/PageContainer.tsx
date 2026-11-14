import { ReactNode } from 'react';

export default function PageContainer({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 min-h-[500px]">
            {children}
        </div>
    </div>
  );
}
