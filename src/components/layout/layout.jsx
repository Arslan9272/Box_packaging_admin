import React, { useState } from 'react';
import Navbar from './navbar';
import Sidebar from './sidebar';

const Layout = ({ children, hideNav = false }) => {  // Made hideNav optional with default
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50"> {/* Changed to flex-col */}
      {!hideNav && <Navbar toggleSidebar={toggleSidebar} />}
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;