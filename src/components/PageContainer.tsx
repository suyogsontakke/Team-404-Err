/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';

interface PageContainerProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export default function PageContainer({ title, subtitle, children, actions }: PageContainerProps) {
  return (
    <div className="w-full max-w-[1720px] min-w-0 mx-auto space-y-4 font-sans text-[#F0EBDD] overflow-x-hidden">
      {title && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#48516A] min-w-0">
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-[#F0EBDD] tracking-tight font-space truncate">{title}</h1>
            {subtitle && <p className="text-xs text-[#B5BDCC] mt-0.5 break-words">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className="w-full max-w-full min-w-0">{children}</div>
    </div>
  );
}
