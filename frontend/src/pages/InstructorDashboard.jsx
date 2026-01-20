import React, { useState, useEffect } from 'react';
import { getAnalyticsDashboard } from '../services/api';
import { 
  BarChart3, 
  Clock, 
  ThumbsUp, 
  ThumbsDown,
  TrendingUp,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const InstructorDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await getAnalyticsDashboard();
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load analytics</p>
      </div>
    );
  }

  const { response_quality, avg_resolution_time_hours, category_stats, common_misconceptions } = analytics;

  // Prepare data for charts
  const qualityPieData = [
    { name: 'Helpful', value: response_quality.helpful_count, color: '#22c55e' },
    { name: 'Unhelpful', value: response_quality.unhelpful_count, color: '#ef4444' }
  ];

  const categoryBarData = category_stats
    .filter(c => c.question_count > 0)
    .map(c => ({
      name: c.category_name.length > 10 ? c.category_name.slice(0, 10) + '...' : c.category_name,
      fullName: c.category_name,
      questions: c.question_count,
      avgResponses: Math.round(c.avg_responses_per_question * 10) / 10
    }));

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Overview of forum activity and student performance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Responses</p>
              <p className="text-2xl font-bold text-indigo-600">
                {response_quality.total_responses}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-indigo-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Helpful Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {response_quality.helpful_percentage}%
              </p>
            </div>
            <ThumbsUp className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Flagged Responses</p>
              <p className="text-2xl font-bold text-red-600">
                {response_quality.unhelpful_count}
              </p>
            </div>
            <ThumbsDown className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Resolution Time</p>
              <p className="text-2xl font-bold text-amber-600">
                {avg_resolution_time_hours 
                  ? `${avg_resolution_time_hours}h` 
                  : 'N/A'}
              </p>
            </div>
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Response Quality Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-indigo-500" />
            Response Quality Distribution
          </h2>
          {response_quality.total_responses > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={qualityPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {qualityPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No response data yet
            </div>
          )}
        </div>

        {/* Questions by Category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-indigo-500" />
            Questions by Category
          </h2>
          {categoryBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'questions' ? 'Questions' : 'Avg Responses']}
                  labelFormatter={(label) => categoryBarData.find(c => c.name === label)?.fullName || label}
                />
                <Bar dataKey="questions" fill="#6366f1" name="Questions" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No questions yet
            </div>
          )}
        </div>
      </div>

      {/* Category Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-5 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-indigo-500" />
            Category Performance
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Questions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Responses
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {category_stats.map(cat => (
                <tr key={cat.category_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{cat.category_name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      cat.question_count > 5 ? 'bg-indigo-100 text-indigo-800' :
                      cat.question_count > 0 ? 'bg-gray-100 text-gray-800' :
                      'bg-gray-50 text-gray-400'
                    }`}>
                      {cat.question_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {cat.avg_responses_per_question?.toFixed(1) || '0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Common Misconceptions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
            Common Issues in Peer Responses
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Patterns in why responses were flagged as unhelpful
          </p>
        </div>
        <div className="p-5">
          {common_misconceptions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No flagged responses yet - great job peers!
            </div>
          ) : (
            <div className="space-y-3">
              {common_misconceptions.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-lg"
                >
                  <div>
                    <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded mr-2">
                      {item.category_name}
                    </span>
                    <span className="text-sm text-amber-800">{item.misconception}</span>
                  </div>
                  <span className="text-sm font-medium text-amber-700">
                    {item.occurrence_count}x
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
