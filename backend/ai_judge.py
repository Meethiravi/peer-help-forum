import os
import json
import re
import csv
from datetime import datetime
from models import AIEvaluation, AIRating

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
CSV_FILE = "gemini_responses.csv"

EVALUATION_PROMPT = """You are an AI judge evaluating peer responses in a programming help forum.

CONTEXT:
- Question Title: {question_title}
- Question Description: {question_description}
- Code Snippet: {code_snippet}

PEER RESPONSE TO EVALUATE:
- Concept Involved: {concept_involved}
- Hint/Guidance: {hint_guidance}
- What to Try Next: {what_to_try_next}

EVALUATION CRITERIA (from educational research):
1. INCORRECT: Does the response contain factually wrong information about programming concepts?
2. DIRECT SOLUTION: Does it give away the actual code/answer instead of guiding?
3. UNINFORMATIVE: Is it too vague or generic to be useful?
4. MISFOCUSED: Does it fail to address the actual problem the student is facing?
5. UNCLEAR: Is it confusing or hard to understand?

RULES:
- A HELPFUL response guides the student toward understanding without giving away the answer
- A HELPFUL response addresses the specific issue in the question
- An UNHELPFUL response fails one or more of the above criteria

Respond in JSON format:
{{
    "rating": "helpful" or "unhelpful",
    "reason": "Brief explanation of why this rating was given",
    "karma_change": 1 for helpful, -1 for harmful (direct solution/incorrect), 0 for just low quality
}}
"""

class GeminiJudge:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or GEMINI_API_KEY
        self.client = None
        self._initialize()
        self._init_csv()
    
    def _init_csv(self):
        """Initialize CSV file with headers if it doesn't exist."""
        if not os.path.exists(CSV_FILE):
            with open(CSV_FILE, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'timestamp',
                    'question_title',
                    'question_description',
                    'code_snippet',
                    'concept_involved',
                    'hint_guidance',
                    'what_to_try_next',
                    'gemini_raw_response',
                    'rating',
                    'reason',
                    'karma_change'
                ])
            print(f"Created CSV log file: {CSV_FILE}")
    
    def _log_to_csv(
        self,
        question_title: str,
        question_description: str,
        code_snippet: str,
        concept_involved: str,
        hint_guidance: str,
        what_to_try_next: str,
        raw_response: str,
        evaluation: AIEvaluation
    ):
        """Log the evaluation to CSV file."""
        try:
            with open(CSV_FILE, 'a', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([
                    datetime.now().isoformat(),
                    question_title,
                    question_description,
                    code_snippet or "",
                    concept_involved,
                    hint_guidance,
                    what_to_try_next or "",
                    raw_response,
                    evaluation.rating.value,
                    evaluation.reason,
                    evaluation.karma_change
                ])
        except Exception as e:
            print(f"Error writing to CSV: {e}")
    
    def _initialize(self):
        """Initialize the Gemini client."""
        try:
            from google import genai
            if self.api_key and self.api_key != "YOUR_GEMINI_API_KEY_HERE":
                self.client = genai.Client(api_key=self.api_key)
            else:
                self.client = genai.Client()
            print("Gemini AI Judge initialized successfully")
        except ImportError:
            print("google-genai not installed. Run: pip install google-genai")
        except Exception as e:
            print(f"Failed to initialize Gemini: {e}")
            print("   Make sure GEMINI_API_KEY environment variable is set.")
    
    def evaluate_response(
        self,
        question_title: str,
        question_description: str,
        code_snippet: str,
        concept_involved: str,
        hint_guidance: str,
        what_to_try_next: str
    ) -> AIEvaluation:
        """
        Evaluate a peer response using Gemini.
        Falls back to mock evaluation if Gemini is not available.
        Logs all evaluations to CSV.
        """
        raw_response = ""
        
        if not self.client:
            evaluation = self._mock_evaluate(
                question_title, question_description, code_snippet,
                concept_involved, hint_guidance, what_to_try_next
            )
            raw_response = "MOCK_EVALUATION"
        else:
            try:
                prompt = EVALUATION_PROMPT.format(
                    question_title=question_title,
                    question_description=question_description,
                    code_snippet=code_snippet or "No code provided",
                    concept_involved=concept_involved,
                    hint_guidance=hint_guidance,
                    what_to_try_next=what_to_try_next or "Not provided"
                )
                
                response = self.client.models.generate_content(
                    model="gemini-3-flash-preview",
                    contents=prompt
                )
                raw_response = response.text
                evaluation = self._parse_response(raw_response)
                
            except Exception as e:
                print(f"Gemini API error: {e}")
                raw_response = f"ERROR: {str(e)}"
                evaluation = self._mock_evaluate(
                    question_title, question_description, code_snippet,
                    concept_involved, hint_guidance, what_to_try_next
                )
        
        # Log to CSV
        self._log_to_csv(
            question_title, question_description, code_snippet,
            concept_involved, hint_guidance, what_to_try_next,
            raw_response, evaluation
        )
        
        return evaluation
    
    def _parse_response(self, response_text: str) -> AIEvaluation:
        """Parse JSON response from Gemini."""
        try:
            json_match = re.search(r'\{[^{}]*\}', response_text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                return AIEvaluation(
                    rating=AIRating(data.get("rating", "helpful")),
                    reason=data.get("reason", "Evaluation completed."),
                    karma_change=int(data.get("karma_change", 0))
                )
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            print(f"Error parsing Gemini response: {e}")
            print(f"Raw response: {response_text}")
        
        #Default if parsing fails
        return AIEvaluation(
            rating=AIRating.helpful,
            reason="Could not parse AI evaluation, defaulting to helpful.",
            karma_change=1
        )
    
    def _mock_evaluate(
        self,
        question_title: str,
        question_description: str,
        code_snippet: str,
        concept_involved: str,
        hint_guidance: str,
        what_to_try_next: str
    ) -> AIEvaluation:
        """
        Fallback mock evaluation using simple heuristics.
        Used when Gemini API is not available.
        """
        hint_lower = hint_guidance.lower()
        
        #Check for direct solution
        code_patterns = [
            r'def\s+\w+\s*\(',  # function definition
            r'for\s+\w+\s+in',   # for loop
            r'while\s+.*:',      # while loop
            r'if\s+.*:\s*\n',    # if statement with newline (likely full code)
            r'return\s+\w+',     # return statement
            r'print\s*\([^)]+\)\s*\n.*print', # multiple print statements
        ]
        
        has_direct_code = any(re.search(pattern, hint_guidance) for pattern in code_patterns)
        
        # too short/vague responses
        is_too_short = len(hint_guidance.strip()) < 30
        
        #unhelpful phrases
        unhelpful_phrases = [
            "just google",
            "google it",
            "read the docs",
            "read documentation",
            "that's just how",
            "figure it out",
            "it's obvious",
            "it's easy",
            "just use",
            "simply do",
        ]
        has_unhelpful_phrase = any(phrase in hint_lower for phrase in unhelpful_phrases)
        
        # Check for helpful indicators
        helpful_indicators = [
            "think about",
            "consider",
            "what happens when",
            "try to",
            "notice that",
            "the concept",
            "this is because",
            "ask yourself",
            "look at",
            "compare",
            "difference between",
        ]
        has_helpful_indicator = any(indicator in hint_lower for indicator in helpful_indicators)
        
        #rating
        if has_direct_code:
            return AIEvaluation(
                rating=AIRating.unhelpful,
                reason="Response contains direct code solution instead of guiding hints.",
                karma_change=-1
            )
        elif is_too_short:
            return AIEvaluation(
                rating=AIRating.unhelpful,
                reason="Response is too brief to be helpful.",
                karma_change=0
            )
        elif has_unhelpful_phrase:
            return AIEvaluation(
                rating=AIRating.unhelpful,
                reason="Response contains dismissive or unhelpful language.",
                karma_change=0
            )
        elif has_helpful_indicator and len(concept_involved.strip()) > 5:
            return AIEvaluation(
                rating=AIRating.helpful,
                reason="Response provides constructive guidance without giving away the solution.",
                karma_change=1
            )
        else:
            return AIEvaluation(
                rating=AIRating.helpful,
                reason="Response appears to provide reasonable guidance.",
                karma_change=1
            )


ai_judge = GeminiJudge()


def get_ai_judge() -> GeminiJudge:
    """Get the AI judge instance."""
    return ai_judge


def configure_ai_judge(api_key: str, provider: str = "gemini"):
    """Reconfigure the AI judge with a new API key."""
    global ai_judge
    ai_judge = GeminiJudge(api_key=api_key)