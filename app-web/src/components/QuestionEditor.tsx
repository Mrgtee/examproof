"use client";

import { useState } from "react";
import type { QuestionType } from "@/types/exam";

interface QuestionEditorProps {
  onAddQuestion: (question: {
    prompt: string;
    questionType: QuestionType;
    points: number;
    options?: string[];
    rubric?: string;
    correctAnswer?: string;
  }) => void;
}

export default function QuestionEditor({ onAddQuestion }: QuestionEditorProps) {
  const [prompt, setPrompt] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType>("mcq");
  const [points, setPoints] = useState(1);
  const [optionsText, setOptionsText] = useState("");
  const [rubric, setRubric] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");

  function handleAdd() {
    const payload = {
      prompt,
      questionType,
      points,
      options:
        questionType === "mcq"
          ? optionsText
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean)
          : undefined,
      rubric: questionType !== "mcq" ? rubric : undefined,
      correctAnswer:
        questionType === "mcq" || questionType === "short_answer"
          ? correctAnswer
          : undefined,
    };

    onAddQuestion(payload);

    setPrompt("");
    setQuestionType("mcq");
    setPoints(1);
    setOptionsText("");
    setRubric("");
    setCorrectAnswer("");
  }

  return (
    <div className="rounded-[28px] border border-[#e7dcd1] bg-white p-6">
      <div className="text-xs uppercase tracking-[0.24em] text-[#7f6a5a]">
        Question builder
      </div>
      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
        Add question
      </h3>

      <div className="mt-6 grid gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px] w-full rounded-[20px] border border-[#e7dcd1] px-4 py-3 outline-none"
            placeholder="Enter the question prompt..."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Question type</label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as QuestionType)}
              className="w-full rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
            >
              <option value="mcq">Multiple choice</option>
              <option value="short_answer">Short answer</option>
              <option value="essay">Essay</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Points</label>
            <input
              type="number"
              min={1}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-full rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
            />
          </div>
        </div>

        {questionType === "mcq" && (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Options
              </label>
              <textarea
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                className="min-h-[120px] w-full rounded-[20px] border border-[#e7dcd1] px-4 py-3 outline-none"
                placeholder={"One option per line\nOption A\nOption B\nOption C"}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Correct answer
              </label>
              <input
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                className="w-full rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
                placeholder="Exact correct option"
              />
            </div>
          </>
        )}

        {questionType === "short_answer" && (
          <div>
            <label className="mb-2 block text-sm font-medium">
              Expected answer
            </label>
            <input
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="w-full rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
              placeholder="Expected short answer"
            />
          </div>
        )}

        {questionType === "essay" && (
          <div>
            <label className="mb-2 block text-sm font-medium">
              Grading rubric
            </label>
            <textarea
              value={rubric}
              onChange={(e) => setRubric(e.target.value)}
              className="min-h-[140px] w-full rounded-[20px] border border-[#e7dcd1] px-4 py-3 outline-none"
              placeholder="Describe the rubric used to assess this essay..."
            />
          </div>
        )}

        <button
          onClick={handleAdd}
          className="mt-2 w-fit rounded-full bg-[#4a3124] px-5 py-3 text-sm font-medium text-white"
        >
          Add question
        </button>
      </div>
    </div>
  );
}