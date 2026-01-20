import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getQuestions } from '../services/api';
import { 
  AlertTriangle, 
  MessageSquare,
  User,
  Clock,
  ChevronRight,
  Inbox
} from 'lucide-react';

const EscalatedQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEscalatedQuestions();
  }, []);

  const loadEscalatedQuestions = async () => {
    try {
      const response = await getQuestions({ status: 'escalated' });
      setQuestions(response.data);
    } catch (error) {
      console.error('Failed to load escalated questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const getUrgencyClass = (createdAt) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours > 24) return 'border-l-4 border-l-red-500';
    if (diffHours > 12) return 'border-l-4 border-l-yellow-500';
    return 'border-l-4 border-l-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <AlertTriangle className="w-6 h-6 mr-2 text-yellow-500" />
          Escalated Questions
        </h1>
        <p className="text-gray-500 mt-1">
          Questions that need instructor attention
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">
              {questions.length} question{questions.length !== 1 ? 's' : ''} need{questions.length === 1 ? 's' : ''} your attention
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              These are questions where students clicked "I still need help" after peer responses didn't resolve their issue.
            </p>
          </div>
        </div>
      </div>

      {/* Urgency Legend */}
      <div className="flex items-center space-x-6 mb-4 text-xs text-gray-500">
        <span className="flex items-center">
          <span className="w-3 h-3 bg-green-500 rounded mr-1.5"></span>
          Less than 12h
        </span>
        <span className="flex items-center">
          <span className="w-3 h-3 bg-yellow-500 rounded mr-1.5"></span>
          12-24h
        </span>
        <span className="flex items-center">
          <span className="w-3 h-3 bg-red-500 rounded mr-1.5"></span>
          More than 24h
        </span>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">All caught up!</p>
            <p className="text-sm text-gray-400 mt-1">
              No escalated questions at the moment
            </p>
          </div>
        ) : (
          questions.map(question => (
            <Link
              key={question.id}
              to={`/instructor/questions/${question.id}`}
              className={`block bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all ${getUrgencyClass(question.created_at)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="flex items-center text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Needs Response
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {question.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {question.description}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center bg-gray-100 px-2 py-1 rounded">
                      <User className="w-3 h-3 mr-1" />
                      {question.student_name}
                    </span>
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {question.category_name}
                    </span>
                    <span className="flex items-center">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      {question.response_count} peer responses
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(question.created_at)}
                    </span>
                  </div>
                </div>
                <div className="ml-4 flex items-center">
                  <span className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors">
                    Respond
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 ml-2" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default EscalatedQuestions;
