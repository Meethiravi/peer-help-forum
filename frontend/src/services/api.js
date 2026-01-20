import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User APIs
export const getUsers = () => api.get('/users');
export const getUser = (userId) => api.get(`/users/${userId}`);
export const createUser = (userData) => api.post('/users', userData);

// Category APIs
export const getCategories = () => api.get('/categories');

// Question APIs
export const getQuestions = (params = {}) => api.get('/questions', { params });
export const getQuestion = (questionId) => api.get(`/questions/${questionId}`);
export const createQuestion = (questionData, studentId) => 
  api.post(`/questions?student_id=${studentId}`, questionData);
export const escalateQuestion = (questionId) => 
  api.post(`/questions/${questionId}/escalate`);
export const updateQuestionStatus = (questionId, status) => 
  api.patch(`/questions/${questionId}/status?status=${status}`);

// Response APIs
export const getResponses = (questionId, includeHidden = false) => 
  api.get(`/questions/${questionId}/responses`, { params: { include_hidden: includeHidden } });
export const createResponse = (responseData, responderId) => 
  api.post(`/responses?responder_id=${responderId}`, responseData);
export const getUserResponses = (userId) => api.get(`/users/${userId}/responses`);

// Instructor Answer APIs
export const getInstructorAnswer = (questionId) => 
  api.get(`/questions/${questionId}/instructor-answer`);
export const createInstructorAnswer = (answerData, instructorId) => 
  api.post(`/instructor-answers?instructor_id=${instructorId}`, answerData);

// Analytics APIs
export const getKarmaLeaderboard = () => api.get('/analytics/karma-leaderboard');
export const getAnalyticsDashboard = () => api.get('/analytics/dashboard');
export const getAllResponses = (includeHidden = true) => 
  api.get('/analytics/all-responses', { params: { include_hidden: includeHidden } });

// AI Configuration
export const configureAI = (apiKey, provider) => 
  api.post(`/config/ai?api_key=${apiKey}&provider=${provider}`);

export default api;
