import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const TestContext = createContext();

export const useTests = () => useContext(TestContext);

export const TestProvider = ({ children }) => {
    const [tests, setTests] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initial load from Supabase
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: testsData, error: testsError } = await supabase.from('tests').select('*');
                if (testsError) console.error('Error fetching tests:', testsError);
                else setTests(testsData || []);

                const { data: subData, error: subError } = await supabase.from('submissions').select('*');
                if (subError) console.error('Error fetching submissions:', subError);
                else setSubmissions(subData || []);
            } catch (err) {
                console.error("Fetch data error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const addTest = async (test) => {
        const newTest = {
            id: Math.random().toString(36).substring(2, 9).toUpperCase(),
            title: test.title || '',
            description: test.description || '',
            category: test.category || 'Umumiy',
            questions: test.questions || [],
            timeLimit: test.timeLimit || 0,
            created_at: new Date().toISOString()
        };

        setTests(prev => [...prev, newTest]);

        const { error } = await supabase.from('tests').insert([newTest]);
        if (error) console.error("Error adding test:", error);

        return newTest.id;
    };

    const deleteTest = async (id) => {
        setTests(prev => prev.filter(t => t.id !== id));
        setSubmissions(prev => prev.filter(s => s.testId !== id));

        const { error } = await supabase.from('tests').delete().eq('id', id);
        if (error) console.error("Error deleting test:", error);
    };

    const submitTest = async (submission) => {
        const newSub = {
            testId: submission.testId,
            studentName: submission.studentName,
            answers: submission.answers,
            score: submission.score,
            totalQuestions: submission.totalQuestions,
            submittedAt: new Date().toISOString()
        };

        setSubmissions(prev => [...prev, newSub]);

        const { error } = await supabase.from('submissions').insert([newSub]);
        if (error) console.error("Error adding submission:", error);
    };

    const getSubmissionsForTest = (testId) => {
        return submissions.filter(s => s.testId === testId);
    };

    const updateTest = async (id, updatedData) => {
        setTests(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));

        const { error } = await supabase.from('tests').update(updatedData).eq('id', id);
        if (error) console.error("Error updating test:", error);
    };

    const hasStudentTaken = (testId, studentName) => {
        return submissions.some(s => s.testId === testId && s.studentName.toLowerCase() === studentName.toLowerCase());
    };

    return (
        <TestContext.Provider value={{
            tests,
            submissions,
            loading,
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
