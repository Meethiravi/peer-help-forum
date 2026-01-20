import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getQuestions, getUserResponses, getUser } from '../services/api';
import { 
  HelpCircle, 
  MessageSquare, 
  Star, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  PlusCircle,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

const StudentDashboard = () => {
  const { currentUser } = useAuth();
  const [myQuestions, setMyQuestions] = useState([]);
  const [myResponses, setMyResponses] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    try {
      const [questionsRes, responsesRes, userRes] = await Promise.all([
        getQuestions({ student_id: currentUser.id }),
        getUserResponses(currentUser.id),
        getUser(currentUser.id)
      ]);
      setMyQuestions(questionsRes.data);
      setMyResponses(responsesRes.data);
      setUserData(userRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <Clock className="w-4 h-4 text-green-500" />;
      case 'escalated':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      open: 'bg-green-100 text-green-800',
      escalated: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const helpfulResponses = myResponses.filter(r => r.ai_rating === 'helpful').length;
  const unhelpfulResponses = myResponses.filter(r => r.ai_rating === 'unhelpful').length;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {currentUser.name}! 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Here's an overview of your activity on the forum
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Karma Points</p>
              <p className="text-2xl font-bold text-yellow-600">{userData?.karma || 0}</p>
            </div>
            <Star className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">My Questions</p>
              <p className="text-2xl font-bold text-indigo-600">{myQuestions.length}</p>
            </div>
            <HelpCircle className="w-8 h-8 text-indigo-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Helpful Answers</p>
              <p className="text-2xl font-bold text-green-600">{helpfulResponses}</p>
            </div>
            <ThumbsUp className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Flagged Answers</p>
              <p className="text-2xl font-bold text-red-600">{unhelpfulResponses}</p>
            </div>
            <ThumbsDown className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Questions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900 flex items-center">
              <HelpCircle className="w-5 h-5 mr-2 text-indigo-500" />
              My Questions
            </h2>
            <Link
              to="/student/questions/new"
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              Ask New
            </Link>
          </div>
          <div className="p-5">
            {myQuestions.length === 0 ? (
              <div className="text-center py-8">
                <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">You haven't asked any questions yet</p>
                <Link
                  to="/student/questions/new"
                  className="inline-block mt-3 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Ask your first question →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myQuestions.slice(0, 5).map(q => (
                  <Link
                    key={q.id}
                    to={`/student/questions/${q.id}`}
                    className="block p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{q.title}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {q.category_name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {q.response_count} responses
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(q.status)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* My Responses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-green-500" />
              My Responses
            </h2>
            <Link
              to="/student/questions"
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Help others →
            </Link>
          </div>
          <div className="p-5">
            {myResponses.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">You haven't helped anyone yet</p>
                <Link
                  to="/student/questions"
                  className="inline-block mt-3 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Browse questions to help →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myResponses.slice(0, 5).map(r => (
                  <div
                    key={r.id}
                    className="p-3 border border-gray-100 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {r.hint_guidance}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-3 flex items-center">
                        {r.ai_rating === 'helpful' ? (
                          <span className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            +{r.karma_awarded}
                          </span>
                        ) : (
                          <span className="flex items-center text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                            <ThumbsDown className="w-3 h-3 mr-1" />
                            {r.karma_awarded}
                          </span>
                        )}
                      </div>
                    </div>
                    {r.ai_rating === 'unhelpful' && (
                      <p className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded">
                        ⚠️ {r.ai_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
