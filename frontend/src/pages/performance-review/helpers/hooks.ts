/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import type { ReviewRequest } from '../types/types';

// Hook for managing review requests state
export const useReviewRequests = (initialRequests: ReviewRequest[] = []) => {
    const [reviewRequests, setReviewRequests] = useState<ReviewRequest[]>(initialRequests);

    const addRequests = (requests: Omit<ReviewRequest, 'id' | 'requestDate' | 'dueDate' | 'status' | 'type'>[]) => {
        const newRequests = requests.map(req => ({
            ...req,
            id: Date.now().toString() + Math.random(),
            requestDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'pending' as const,
            type: 'peer-review' as const
        }));
        setReviewRequests(prev => [...prev, ...newRequests]);
    };

    const updateRequestStatus = (id: string, status: ReviewRequest['status']) => {
        setReviewRequests(prev =>
            prev.map(r => r.id === id ? { ...r, status } : r)
        );
    };

    const getRequestsForUser = (userId: number, asReviewer: boolean = true) => {
        return reviewRequests.filter(r =>
            asReviewer ? r.reviewerId === userId : r.requesterId === userId
        );
    };

    const getPendingCount = (userId: number) => {
        return reviewRequests.filter(r => r.reviewerId === userId && r.status === 'pending').length;
    };

    return {
        reviewRequests,
        addRequests,
        updateRequestStatus,
        getRequestsForUser,
        getPendingCount,
        setReviewRequests
    };
};

// Hook for managing form state in reviews
export const useReviewForm = (questions: any[]) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [responses, setResponses] = useState<any[]>([]);
    const [currentAnswer, setCurrentAnswer] = useState<string>('');
    const [isComplete, setIsComplete] = useState(false);

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    const handleNext = () => {
        if (currentAnswer.trim()) {
            const newResponse = {
                questionId: currentQuestion.id,
                answer: currentAnswer,
            };
            setResponses(prev => [...prev, newResponse]);
            setCurrentAnswer('');

            if (currentQuestionIndex < questions.length - 1) {
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

    const reset = () => {
        setCurrentQuestionIndex(0);
        setResponses([]);
        setCurrentAnswer('');
        setIsComplete(false);
    };

    return {
        currentQuestionIndex,
        currentQuestion,
        currentAnswer,
        responses,
        isComplete,
        progress,
        setCurrentAnswer,
        handleNext,
        handlePrev,
        reset
    };
};

// Hook for local storage persistence
export const useLocalStorage = <T>(key: string, initialValue: T) => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    };

    return [storedValue, setValue] as const;
};

// Hook for dark mode
export const useDarkMode = () => {
    const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode', false);

    useEffect(() => {
        const root = window.document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [isDarkMode]);

    return [isDarkMode, setIsDarkMode] as const;
};

// Hook for managing search and filtering
export const useSearch = <T>(items: T[], searchFields: (keyof T)[]) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredItems, setFilteredItems] = useState<T[]>(items);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredItems(items);
            return;
        }

        const filtered = items.filter(item =>
            searchFields.some(field => {
                const value = item[field];
                return typeof value === 'string' &&
                    value.toLowerCase().includes(searchQuery.toLowerCase());
            })
        );

        setFilteredItems(filtered);
    }, [items, searchQuery, searchFields]);

    return {
        searchQuery,
        setSearchQuery,
        filteredItems
    };
};