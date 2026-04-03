export type QuestionType = "mcq" | "short_answer" | "essay";

export interface Question {
  id: string;
  prompt: string;
  type: QuestionType;
  points: number;
  options?: string[];
  rubric?: string;
  correctAnswer?: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  privateLinkToken: string;
  questions: Question[];
  createdAt: string;
}

export interface Submission {
  id: string;
  examId: string;
  candidateId: string;
  answers: Record<string, string>;
  finalSubmissionHash?: string;
  score?: number;
  status: "draft" | "submitted" | "scored" | "appealed";
}