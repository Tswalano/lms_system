import { ChevronLeft, ChevronRight, Send, Award } from 'lucide-react';
import type { Question } from '../types/types';

export const ProgressBar = ({ currentIndex, total, progress }: {
    currentIndex: number;
    total: number;
    progress: number;
}) => {
    return (
        <div className="mb-6">
            <div className="flex justify-between text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                <span>Question {currentIndex + 1} of {total}</span>
                <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
};

export const QuestionDisplay = ({ question }: { question: Question }) => {
    return (
        <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {question.question}
            </h3>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {question.category}
            </p>
        </div>
    );
};

export const NavigationButtons = ({ canGoPrev, canGoNext, isLastQuestion, onPrev, onNext }: {
    canGoPrev: boolean;
    canGoNext: boolean;
    isLastQuestion: boolean;
    onPrev: () => void;
    onNext: () => void;
}) => {
    return (
        <div className="flex justify-between">
            <button
                onClick={onPrev}
                disabled={!canGoPrev}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
                <ChevronLeft className="w-4 h-4" />
                Previous
            </button>
            <button
                onClick={onNext}
                disabled={!canGoNext}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
                {isLastQuestion ? (
                    <>
                        Submit Review <Send className="w-4 h-4" />
                    </>
                ) : (
                    <>
                        Next <ChevronRight className="w-4 h-4" />
                    </>
                )}
            </button>
        </div>
    );
};

export const ReviewForm = ({ currentQuestionIndex, totalQuestions, question, currentAnswer, onAnswerChange, onNext, onPrev, progress }: {
    currentQuestionIndex: number;
    totalQuestions: number;
    question: Question;
    currentAnswer: string;
    onAnswerChange: (answer: string) => void;
    onNext: () => void;
    onPrev: () => void;
    progress: number;
}) => {
    return (
        <>
            <ProgressBar
                currentIndex={currentQuestionIndex}
                total={totalQuestions}
                progress={progress}
            />

            <QuestionDisplay question={question} />

            <textarea
                value={currentAnswer}
                onChange={(e) => onAnswerChange(e.target.value)}
                rows={8}
                placeholder="Type your answer here..."
                className="w-full px-4 py-3 mb-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <NavigationButtons
                canGoPrev={currentQuestionIndex > 0}
                canGoNext={currentAnswer.trim().length > 0}
                isLastQuestion={currentQuestionIndex >= totalQuestions - 1}
                onPrev={onPrev}
                onNext={onNext}
            />
        </>
    );
};

export const ReviewComplete = ({ title, subtitle, onSubmit }: {
    title: string;
    subtitle: string;
    onSubmit: () => void;
}) => {
    return (
        <div className="text-center py-12">
            <Award className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{subtitle}</p>
            <button
                onClick={onSubmit}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mx-auto"
            >
                <Send className="w-4 h-4" />
                Submit Review
            </button>
        </div>
    );
};