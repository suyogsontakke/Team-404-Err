/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Auto-collapse desktop sidebar on smaller screens and handle resize cleanly
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setMobileSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Automatically close mobile sidebar drawer when route changes
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname, location.search]);

  // Close mobile sidebar on Escape key
  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileSidebarOpen]);

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(prev => !prev);
  };

  return (
    <div className="flex h-dvh w-full max-w-full bg-[#171B2B] text-[#F0EBDD] overflow-hidden font-sans relative">
      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/65 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar Container (Off-canvas drawer on <lg, docked on lg+) */}
      <div
        id="mobile-navigation-sidebar"
        className={clsx(
          "fixed inset-y-0 left-0 z-50 transform lg:relative lg:transform-none transition-transform duration-300 ease-in-out shrink-0",
          mobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <Sidebar 
          isOpen={sidebarOpen} 
          setIsOpen={setSidebarOpen} 
          isMobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-hidden">
        <Header 
          isMobileSidebarOpen={mobileSidebarOpen}
          onToggleMobileSidebar={toggleMobileSidebar} 
        />
        <main className="flex-1 w-full max-w-full min-w-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-5 bg-[#171B2B]">
          <div className="w-full max-w-full min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
