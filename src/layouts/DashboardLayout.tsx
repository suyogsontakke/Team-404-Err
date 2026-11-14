import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { clsx } from 'clsx';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Auto-collapse on mobile/tablet
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-[#03060E] text-slate-200 overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        ></div>
      )}
      
      <div className={clsx(
        "fixed inset-y-0 left-0 z-50 transform lg:relative lg:transform-none transition-transform duration-300 ease-in-out",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onToggleMobileSidebar={toggleMobileSidebar} />
        <main className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-3.5 bg-[#03060E]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
