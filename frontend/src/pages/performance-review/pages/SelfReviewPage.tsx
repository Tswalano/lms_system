import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Question, Response } from '../types/types';
import { BackButton, PageHeader } from '../Components/SharedComponents';
import { ReviewComplete, ReviewForm } from '../Components/ReviewFormComponents';

const SelfReviewPage: React.FC = () => {
    const navigate = useNavigate();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [responses, setResponses] = useState<Response[]>([]);
    const [currentAnswer, setCurrentAnswer] = useState<string>('');
    const [isComplete, setIsComplete] = useState(false);

    const selfQuestions: Question[] = [
        { id: 'self-1', type: 'self', category: 'Technical Skills', question: "What was your most impactful technical contribution this period?" },
        { id: 'self-2', type: 'self', category: 'Leadership', question: "Describe a project where you led the implementation or guided others." },
        { id: 'self-3', type: 'self', category: 'Expertise', question: "How would you rate your proficiency in your core technical areas? Provide specific examples." },
        { id: 'self-4', type: 'self', category: 'Innovation', question: "What innovations or improvements have you implemented? What complex challenges have you solved?" },
        { id: 'self-5', type: 'self', category: 'Collaboration', question: "How have you collaborated with team members and other departments?" },
        { id: 'self-6', type: 'self', category: 'Problem Solving', question: "Describe a significant technical or process challenge you overcame this period." },
        { id: 'self-7', type: 'self', category: 'Growth & Learning', question: "What new skills or knowledge have you acquired? How have you applied them?" },
        { id: 'self-8', type: 'self', category: 'Future Goals', question: "What are your goals for the next quarter? What would you like to improve or learn?" },
    ];

    const currentQuestion = selfQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / selfQuestions.length) * 100;

    const handleNext = () => {
        if (currentAnswer.trim()) {
            const newResponse: Response = {
                questionId: currentQuestion.id,
                answer: currentAnswer,
            };
            setResponses(prev => [...prev, newResponse]);
            setCurrentAnswer('');
            if (currentQuestionIndex < selfQuestions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                setIsComplete(true);
            }
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            const prevResponse = responses[currentQuestionIndex - 1];
            if (prevResponse) {
                setCurrentAnswer(prevResponse.answer as string);
                setResponses(prev => prev.slice(0, prev.length - 1));
            }
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmitReview = () => {
        // TODO: Submit the self-review to your backend or state management
        console.log('Submitting self-review:', responses);

        // Show success message
        alert('Self-review submitted successfully!');

        // Navigate back to dashboard
        navigate('/performance');
    };

    const handleBack = () => {
        navigate('/performance');
    };

    return (
        <div className="max-w-6xl mx-auto">
            <BackButton onBack={handleBack} />
            <PageHeader title="Self Review" />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                {!isComplete ? (
                    <ReviewForm
                        currentQuestionIndex={currentQuestionIndex}
                        totalQuestions={selfQuestions.length}
                        question={currentQuestion}
                        currentAnswer={currentAnswer}
                        onAnswerChange={setCurrentAnswer}
                        onNext={handleNext}
                        onPrev={handlePrev}
                        progress={progress}
                    />
                ) : (
                    <ReviewComplete
                        title="Review Complete!"
                        subtitle="Thank you for completing your self-review. You can now submit it."
                        onSubmit={handleSubmitReview}
                    />
                )}
            </div>
        </div>
    );
};

export default SelfReviewPage;