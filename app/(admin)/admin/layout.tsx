'use client';

import "../../globals.css";
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  MdDashboard,
  MdDescription,
  MdPeople,
  MdSettings,
  MdLogout,
  MdMenu,
  MdClose,
  MdShield,
  MdNotifications,
  MdSearch
} from 'react-icons/md';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { icon: MdDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: MdDescription, label: 'Insurance Plans', href: '/admin/insurances' },
  { icon: MdPeople, label: 'Customers', href: '/admin/customers' },
  { icon: MdShield, label: 'Claims', href: '/admin/claims' },
  { icon: MdSettings, label: 'Settings', href: '/admin/settings' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    // Add logout logic here
    router.push('/');
  };

  return (<html>
    <body>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } bg-white border-r border-gray-200 w-64`}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <MdShield className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-800">MC Admin</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname?.includes(item.href);
                
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <MdLogout className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className={`transition-all ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
          {/* Top Header */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <MdMenu className="w-6 h-6" />
                </button>

                {/* Search Bar */}
                <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-4 py-2 w-96">
                  <MdSearch className="w-5 h-5 text-gray-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="bg-transparent outline-none text-gray-700 w-full"
                  />
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <button className="relative text-gray-500 hover:text-gray-700">
                  <MdNotifications className="w-6 h-6" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* User Profile */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">A</span>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-700">Admin User</p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6">
            {children}
          </main>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
      </div>
    </body>
  </html>);
}