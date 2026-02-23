import React, { createContext, useContext, useState, useEffect } from 'react';

const TestContext = createContext();

export const useTests = () => useContext(TestContext);

const demoTest = {
    id: "DEMO123",
    title: "Ingliz tili: Asosiy So'zlar",
    description: "Beginner darajasidagi o'quvchilar uchun qisqa test",
    category: "Ingliz tili (Beginner)",
    createdAt: new Date().toISOString(),
    questions: [
        { id: 1, text: "Apple so'zining o'zbekcha tarjimasi nima?", options: ["Olma", "Nok", "Banan", "Uzum"], correctOption: 0 },
        { id: 2, text: "Qizil rang inglizchada qanday yoziladi?", options: ["Blue", "Yellow", "Red", "Green"], correctOption: 2 },
        { id: 3, text: "Ingliz tilida nechta harf bor?", options: ["24", "26", "28", "30"], correctOption: 1 }
    ]
};

const demoSubmission = {
    testId: "DEMO123",
    studentName: "Durdona Aliyeva",
    answers: { 1: 0, 2: 2, 3: 0 }, // 100% is 1:0, 2:2, 3:1 -> answered 3 wrong
    score: 2,
    totalQuestions: 3,
    submittedAt: new Date().toISOString()
};

export const TestProvider = ({ children }) => {
    const [tests, setTests] = useState(() => {
        const saved = localStorage.getItem('tests');
        const parsed = saved ? JSON.parse(saved) : null;
        return (parsed && parsed.length > 0) ? parsed : [demoTest];
    });

    const [submissions, setSubmissions] = useState(() => {
        const saved = localStorage.getItem('submissions');
        const parsed = saved ? JSON.parse(saved) : null;
        return (parsed && parsed.length > 0) ? parsed : [demoSubmission];
    });

    useEffect(() => {
        localStorage.setItem('tests', JSON.stringify(tests));
    }, [tests]);

    useEffect(() => {
        localStorage.setItem('submissions', JSON.stringify(submissions));
    }, [submissions]);

    const addTest = (test) => {
        const newTest = {
            ...test,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
        };
        setTests(prev => [...prev, newTest]);
        return newTest.id;
    };

    const deleteTest = (id) => {
        setTests(prev => prev.filter(t => t.id !== id));
        setSubmissions(prev => prev.filter(s => s.testId !== id)); // Delete related submissions
    };

    const submitTest = (submission) => {
        setSubmissions(prev => [...prev, { ...submission, submittedAt: new Date().toISOString() }]);
    };

    const getSubmissionsForTest = (testId) => {
        return submissions.filter(s => s.testId === testId);
    };

    const updateTest = (id, updatedData) => {
        setTests(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));
    };

    const hasStudentTaken = (testId, studentName) => {
        return submissions.some(s => s.testId === testId && s.studentName.toLowerCase() === studentName.toLowerCase());
    };

    return (
        <TestContext.Provider value={{
            tests,
            submissions,
            addTest,
            deleteTest,
            submitTest,
            getSubmissionsForTest,
            updateTest,
            hasStudentTaken
        }}>
            {children}
        </TestContext.Provider>
    );
};
