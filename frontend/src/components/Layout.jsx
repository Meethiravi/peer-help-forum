import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  MessageSquare, 
  PlusCircle, 
  AlertTriangle, 
  Award, 
  BarChart3,
  LogOut,
  User
} from 'lucide-react';

const Layout = ({ children }) => {
  const { currentUser, logout, isStudent, isInstructor } = useAuth();
  const location = useLocation();

  const studentNavItems = [
    { path: '/student/dashboard', label: 'My Dashboard', icon: Home },
    { path: '/student/questions', label: 'Browse Questions', icon: MessageSquare },
    { path: '/student/questions/new', label: 'Ask Question', icon: PlusCircle },
  ];

  const instructorNavItems = [
    { path: '/instructor/dashboard', label: 'Analytics', icon: BarChart3 },
    { path: '/instructor/questions', label: 'All Questions', icon: MessageSquare },
    { path: '/instructor/escalated', label: 'Escalated', icon: AlertTriangle },
    { path: '/instructor/karma', label: 'Karma Board', icon: Award },
  ];

  const navItems = isStudent ? studentNavItems : instructorNavItems;

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">
                Peer Help Forum
              </span>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-full">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {currentUser?.name}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isStudent 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {currentUser?.role}
                </span>
                {isStudent && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                    ⭐ {currentUser?.karma || 0}
                  </span>
                )}
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 min-h-[calc(100vh-4rem)] bg-white border-r border-gray-200">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${
                    isActive(item.path) ? 'text-indigo-600' : 'text-gray-400'
                  }`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Guidelines Section */}
          <div className="p-4 mt-4 border-t border-gray-200">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-medium text-amber-800 mb-2">📋 Guidelines</h3>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• Guide, don't give direct answers</li>
                <li>• Explain the concept first</li>
                <li>• Suggest what to try next</li>
                <li>• Be respectful and helpful</li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
