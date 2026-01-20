import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createQuestion, getCategories } from '../services/api';
import { HelpCircle, Code, FileText, Tag, Send, ArrowLeft } from 'lucide-react';

const NewQuestion = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    code_snippet: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.category_id) newErrors.category_id = 'Please select a category';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.trim().length < 20) {
      newErrors.description = 'Please provide more detail (at least 20 characters)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await createQuestion({
        title: formData.title.trim(),
        category_id: parseInt(formData.category_id),
        code_snippet: formData.code_snippet.trim() || null,
        description: formData.description.trim()
      }, currentUser.id);
      
      navigate(`/student/questions/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create question:', error);
      alert('Failed to post question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Ask a Question</h1>
              <p className="text-sm text-gray-500">Get help from your peers</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 mr-2 text-gray-400" />
              Question Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., How do I iterate through a nested dictionary?"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.title ? 'border-red-300' : 'border-gray-200'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 mr-2 text-gray-400" />
              Category
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white ${
                errors.category_id ? 'border-red-300' : 'border-gray-200'
              }`}
            >
              <option value="">Select a category...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.category_id && (
              <p className="mt-1 text-sm text-red-500">{errors.category_id}</p>
            )}
          </div>

          {/* Code Snippet */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Code className="w-4 h-4 mr-2 text-gray-400" />
              Code Snippet
              <span className="ml-2 text-xs text-gray-400">(optional)</span>
            </label>
            <textarea
              name="code_snippet"
              value={formData.code_snippet}
              onChange={handleChange}
              rows={8}
              placeholder="Paste your code here..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm bg-gray-50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 mr-2 text-gray-400" />
              What's the issue? What have you tried?
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe what you're trying to do, what's happening, and what you've already tried..."
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-200'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">💡 Tips for a good question</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Be specific about what you're trying to achieve</li>
              <li>• Include the relevant code that's causing issues</li>
              <li>• Explain what you expected vs what happened</li>
              <li>• Mention what you've already tried</li>
            </ul>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Post Question
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewQuestion;
