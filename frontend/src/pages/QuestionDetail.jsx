import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getQuestion, 
  getResponses, 
  createResponse, 
  escalateQuestion,
  getInstructorAnswer,
  createInstructorAnswer
} from '../services/api';
import { 
  ArrowLeft, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  MessageSquare,
  Send,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  User,
  GraduationCap,
  HelpCircle
} from 'lucide-react';

const QuestionDetail = ({ isInstructor = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [question, setQuestion] = useState(null);
  const [responses, setResponses] = useState([]);
  const [instructorAnswer, setInstructorAnswer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseForm, setResponseForm] = useState({
    concept_involved: '',
    hint_guidance: '',
    what_to_try_next: ''
  });
  const [instructorResponse, setInstructorResponse] = useState('');
  const [aiResult, setAiResult] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [questionRes, responsesRes, instructorAnswerRes] = await Promise.all([
        getQuestion(id),
        getResponses(id, isInstructor),
        getInstructorAnswer(id)
      ]);
      setQuestion(questionRes.data);
      setResponses(responsesRes.data);
      setInstructorAnswer(instructorAnswerRes.data);
    } catch (error) {
      console.error('Failed to load question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseSubmit = async (e) => {
    e.preventDefault();
    if (!responseForm.concept_involved.trim() || !responseForm.hint_guidance.trim()) {
      alert('Please fill in the required fields');
      return;
    }

    setSubmitting(true);
    setAiResult(null);
    
    try {
      const response = await createResponse({
        question_id: parseInt(id),
        concept_involved: responseForm.concept_involved.trim(),
        hint_guidance: responseForm.hint_guidance.trim(),
        what_to_try_next: responseForm.what_to_try_next.trim() || null
      }, currentUser.id);

      const newResponse = response.data;
      
      setAiResult({
        rating: newResponse.ai_rating,
        reason: newResponse.ai_reason,
        karma: newResponse.karma_awarded,
        isVisible: newResponse.is_visible
      });

      if (newResponse.is_visible) {
        setResponses(prev => [...prev, newResponse]);
      }
      
      setResponseForm({
        concept_involved: '',
        hint_guidance: '',
        what_to_try_next: ''
      });
      
      setTimeout(() => {
        setShowResponseForm(false);
        setAiResult(null);
      }, 5000);
      
    } catch (error) {
      console.error('Failed to submit response:', error);
      alert('Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalate = async () => {
    if (!confirm('Are you sure you want to escalate this question to instructors?')) return;
    
    try {
      await escalateQuestion(id);
      setQuestion(prev => ({ ...prev, status: 'escalated' }));
    } catch (error) {
      console.error('Failed to escalate question:', error);
    }
  };

  const handleInstructorSubmit = async (e) => {
    e.preventDefault();
    if (!instructorResponse.trim()) return;

    setSubmitting(true);
    try {
      const response = await createInstructorAnswer({
        question_id: parseInt(id),
        content: instructorResponse.trim()
      }, currentUser.id);
      
      setInstructorAnswer(response.data);
      setQuestion(prev => ({ ...prev, status: 'closed' }));
      setInstructorResponse('');
    } catch (error) {
      console.error('Failed to submit instructor answer:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      open: { bg: 'bg-green-100', text: 'text-green-800', icon: Clock },
      escalated: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertTriangle },
      closed: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle }
    };
    const { bg, text, icon: Icon } = config[status];
    return (
      <span className={`flex items-center space-x-1 text-sm px-3 py-1 rounded-full ${bg} ${text}`}>
        <Icon className="w-4 h-4" />
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </span>
    );
  };

  const isOwnQuestion = question?.student_id === currentUser.id;
  const canRespond = !isInstructor && !isOwnQuestion && question?.status === 'open';
  const canEscalate = isOwnQuestion && question?.status === 'open';
  const canInstructorAnswer = isInstructor && question?.status === 'escalated' && !instructorAnswer;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Question not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </button>

      {/* Question Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                {getStatusBadge(question.status)}
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {question.category_name}
                </span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">{question.title}</h1>
            </div>
          </div>

          <p className="text-gray-700 mb-4 whitespace-pre-wrap">{question.description}</p>

          {question.code_snippet && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Code:</h3>
              <pre className="code-block overflow-x-auto">
                <code>{question.code_snippet}</code>
              </pre>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
            <span>
              Posted {new Date(question.created_at).toLocaleDateString()} at{' '}
              {new Date(question.created_at).toLocaleTimeString()}
            </span>
            {isInstructor && (
              <span className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {question.student_name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Instructor Answer (if exists) */}
      {instructorAnswer && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-purple-800">Instructor Answer</span>
            <span className="text-sm text-purple-600">
              by {instructorAnswer.instructor_name}
            </span>
          </div>
          <p className="text-purple-900 whitespace-pre-wrap">{instructorAnswer.content}</p>
        </div>
      )}

      {/* Responses Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-indigo-500" />
            Peer Responses ({responses.length})
          </h2>
        </div>

        {responses.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No responses yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {responses.map((response, index) => (
              <div key={response.id} className={`p-5 ${!response.is_visible ? 'bg-red-50' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-700">
                        {isInstructor ? response.responder_name?.charAt(0) : `#${index + 1}`}
                      </span>
                    </div>
                    {isInstructor && (
                      <span className="text-sm text-gray-600">{response.responder_name}</span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(response.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  {response.ai_rating === 'helpful' ? (
                    <span className="flex items-center text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      Helpful
                    </span>
                  ) : (
                    <span className="flex items-center text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                      <ThumbsDown className="w-3 h-3 mr-1" />
                      Hidden
                    </span>
                  )}
                </div>

                <div className="space-y-3 ml-10">
                  <div>
                    <span className="text-xs font-medium text-gray-500">Concept:</span>
                    <p className="text-gray-700">{response.concept_involved}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Guidance:</span>
                    <p className="text-gray-700">{response.hint_guidance}</p>
                  </div>
                  {response.what_to_try_next && (
                    <div>
                      <span className="text-xs font-medium text-gray-500">Try next:</span>
                      <p className="text-gray-700">{response.what_to_try_next}</p>
                    </div>
                  )}
                </div>

                {!response.is_visible && isInstructor && (
                  <div className="mt-3 ml-10 text-sm text-red-600 bg-red-100 p-2 rounded">
                    ⚠️ AI Reason: {response.ai_reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Result Popup */}
      {aiResult && (
        <div className={`fixed bottom-6 right-6 max-w-sm p-4 rounded-xl shadow-lg ${
          aiResult.rating === 'helpful' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start space-x-3">
            {aiResult.rating === 'helpful' ? (
              <ThumbsUp className="w-6 h-6 text-green-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            )}
            <div>
              <p className={`font-medium ${aiResult.rating === 'helpful' ? 'text-green-800' : 'text-red-800'}`}>
                {aiResult.rating === 'helpful' 
                  ? `Great response! +${aiResult.karma} karma` 
                  : 'Response flagged'}
              </p>
              <p className={`text-sm ${aiResult.rating === 'helpful' ? 'text-green-600' : 'text-red-600'}`}>
                {aiResult.reason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Escalate Button (for question owner) */}
      {canEscalate && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <HelpCircle className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Still need help?</p>
                <p className="text-sm text-yellow-600">
                  Escalate this question to get help from an instructor
                </p>
              </div>
            </div>
            <button
              onClick={handleEscalate}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Escalate to Instructor
            </button>
          </div>
        </div>
      )}

      {/* Response Form (for other students) */}
      {canRespond && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => setShowResponseForm(!showResponseForm)}
              className="flex items-center text-indigo-600 hover:text-indigo-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {showResponseForm ? 'Cancel' : 'Write a Response'}
            </button>
          </div>

          {showResponseForm && (
            <form onSubmit={handleResponseSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What concept is involved? *
                </label>
                <input
                  type="text"
                  value={responseForm.concept_involved}
                  onChange={(e) => setResponseForm(prev => ({ ...prev, concept_involved: e.target.value }))}
                  placeholder="e.g., Loop iteration, Dictionary access"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hint / Guidance *
                </label>
                <textarea
                  value={responseForm.hint_guidance}
                  onChange={(e) => setResponseForm(prev => ({ ...prev, hint_guidance: e.target.value }))}
                  placeholder="Guide them toward the solution without giving the direct answer..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What should they try next?
                </label>
                <input
                  type="text"
                  value={responseForm.what_to_try_next}
                  onChange={(e) => setResponseForm(prev => ({ ...prev, what_to_try_next: e.target.value }))}
                  placeholder="e.g., Try printing the variable at each step"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-700">
                  ⚠️ Your response will be evaluated by AI. Avoid giving direct code solutions - focus on guiding the student to understand the concept.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Response
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Instructor Answer Form */}
      {canInstructorAnswer && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <GraduationCap className="w-5 h-5 mr-2 text-purple-500" />
              Provide Instructor Answer
            </h3>
          </div>

          <form onSubmit={handleInstructorSubmit} className="p-5 space-y-4">
            <textarea
              value={instructorResponse}
              onChange={(e) => setInstructorResponse(e.target.value)}
              placeholder="Provide a helpful response to help the student understand..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit & Close Question
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default QuestionDetail;
