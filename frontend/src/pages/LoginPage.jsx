import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Users, GraduationCap } from 'lucide-react';

const LoginPage = () => {
  const { users, login, loading } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    
    const user = users.find(u => u.id === parseInt(selectedUserId));
    if (user) {
      login(user);
    }
  };

  const students = users.filter(u => u.role === 'student');
  const instructors = users.filter(u => u.role === 'instructor');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Peer Help Forum</h1>
          <p className="text-gray-500 mt-2">
            A peer-first triage system for programming education
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select your account
            </label>
            
            {/* Instructors */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 text-sm font-medium text-purple-700 mb-2">
                <GraduationCap className="w-4 h-4" />
                <span>Instructors</span>
              </div>
              <div className="space-y-2">
                {instructors.map(user => (
                  <label
                    key={user.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedUserId === String(user.id)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="user"
                      value={user.id}
                      checked={selectedUserId === String(user.id)}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="sr-only"
                    />
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-purple-700">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                      <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                        Instructor
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Students */}
            <div>
              <div className="flex items-center space-x-2 text-sm font-medium text-blue-700 mb-2">
                <Users className="w-4 h-4" />
                <span>Students</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {students.map(user => (
                  <label
                    key={user.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedUserId === String(user.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="user"
                      value={user.id}
                      checked={selectedUserId === String(user.id)}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="sr-only"
                    />
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-blue-700">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">{user.name}</span>
                        <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          Student
                        </span>
                      </div>
                      <span className="text-xs text-yellow-600">⭐ {user.karma}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!selectedUserId}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
              selectedUserId
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </form>

        {/* Info */}
        <p className="text-center text-xs text-gray-400 mt-6">
          This is a prototype for the Peer-First Triage System
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
