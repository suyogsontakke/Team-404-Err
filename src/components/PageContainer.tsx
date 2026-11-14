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
    <div className="w-full max-w-[1720px] mx-auto space-y-4 font-sans text-[#F0EBDD]">
      {title && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#48516A]">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-[#F0EBDD] tracking-tight font-space">{title}</h1>
            {subtitle && <p className="text-xs text-[#B5BDCC] mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
