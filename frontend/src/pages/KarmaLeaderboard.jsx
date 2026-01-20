import React, { useState, useEffect } from 'react';
import { getKarmaLeaderboard } from '../services/api';
import { 
  Award, 
  Star,
  ThumbsUp,
  ThumbsDown,
  Trophy,
  Medal,
  TrendingUp
} from 'lucide-react';

const KarmaLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await getKarmaLeaderboard();
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gray-400 font-medium">#{index + 1}</span>;
    }
  };

  const getRankStyle = (index) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
      case 1:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
      case 2:
        return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Calculate stats
  const totalKarma = leaderboard.reduce((sum, s) => sum + s.karma, 0);
  const totalHelpful = leaderboard.reduce((sum, s) => sum + s.helpful_responses, 0);
  const totalUnhelpful = leaderboard.reduce((sum, s) => sum + s.unhelpful_responses, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Award className="w-6 h-6 mr-2 text-yellow-500" />
          Karma Leaderboard
        </h1>
        <p className="text-gray-500 mt-1">
          Students ranked by their helpfulness in peer responses
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Karma Earned</p>
              <p className="text-2xl font-bold text-yellow-600">{totalKarma}</p>
            </div>
            <Star className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Helpful Responses</p>
              <p className="text-2xl font-bold text-green-600">{totalHelpful}</p>
            </div>
            <ThumbsUp className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Flagged Responses</p>
              <p className="text-2xl font-bold text-red-600">{totalUnhelpful}</p>
            </div>
            <ThumbsDown className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-900 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-indigo-500" />
            Student Rankings
          </h2>
        </div>

        {leaderboard.length === 0 ? (
          <div className="p-12 text-center">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No peer responses yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {leaderboard.map((student, index) => (
              <div
                key={student.user_id}
                className={`p-4 flex items-center justify-between ${getRankStyle(index)} border-l-4 ${
                  index === 0 ? 'border-l-yellow-400' :
                  index === 1 ? 'border-l-gray-400' :
                  index === 2 ? 'border-l-amber-400' :
                  'border-l-transparent'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getRankIcon(index)}
                  </div>
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-indigo-700">
                      {student.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span className="flex items-center text-green-600">
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        {student.helpful_responses} helpful
                      </span>
                      <span className="flex items-center text-red-600">
                        <ThumbsDown className="w-3 h-3 mr-1" />
                        {student.unhelpful_responses} flagged
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className={`text-xl font-bold ${
                    student.karma > 0 ? 'text-yellow-600' :
                    student.karma < 0 ? 'text-red-600' :
                    'text-gray-400'
                  }`}>
                    {student.karma > 0 ? '+' : ''}{student.karma}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Karma Explanation */}
      <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-xl p-5">
        <h3 className="font-medium text-indigo-800 mb-2">How Karma Works</h3>
        <ul className="text-sm text-indigo-700 space-y-1">
          <li>• <strong>+1 karma</strong> for each helpful peer response (as judged by AI)</li>
          <li>• <strong>-1 karma</strong> for harmful responses (giving direct code, incorrect info)</li>
          <li>• <strong>0 karma</strong> for low-quality but not harmful responses (too vague, unclear)</li>
        </ul>
      </div>
    </div>
  );
};

export default KarmaLeaderboard;
