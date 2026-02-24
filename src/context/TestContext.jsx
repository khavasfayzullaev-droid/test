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
                let parsedTests = [];
                if (testsData) {
                    parsedTests = testsData.map(t => {
                        let desc = t.description || '';
                        let showAnswers = false;
                        if (desc.includes(':::SHOW_ANSWERS=true:::')) {
                            showAnswers = true;
                            desc = desc.replace(':::SHOW_ANSWERS=true:::', '');
                        } else if (desc.includes(':::SHOW_ANSWERS=false:::')) {
                            showAnswers = false;
                            desc = desc.replace(':::SHOW_ANSWERS=false:::', '');
                        }
                        return { ...t, description: desc, showAnswers };
                    });
                }
                setTests(parsedTests);

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
        const encodedDesc = `${test.description || ''}:::SHOW_ANSWERS=${test.showAnswers === true}:::`;
        const newTest = {
            id: Math.random().toString(36).substring(2, 9).toUpperCase(),
            title: test.title || '',
            description: encodedDesc,
            category: test.category || 'Umumiy',
            questions: test.questions || [],
            timeLimit: test.timeLimit || 0,
            created_at: new Date().toISOString()
        };

        const stateTest = { ...newTest, description: test.description || '', showAnswers: test.showAnswers === true };
        setTests(prev => [...prev, stateTest]);

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
        const currentTest = tests.find(t => t.id === id) || {};
        const mergedData = { ...currentTest, ...updatedData };
        const encodedDesc = `${mergedData.description || ''}:::SHOW_ANSWERS=${mergedData.showAnswers === true}:::`;

        // Update local React state with pure data (no encoding)
        setTests(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));

        // Prepare payload for Supabase (with encoded description and without showAnswers)
        const dbPayload = { ...updatedData };
        if (updatedData.hasOwnProperty('description') || updatedData.hasOwnProperty('showAnswers')) {
            dbPayload.description = encodedDesc;
        }
        delete dbPayload.showAnswers;

        const { error } = await supabase.from('tests').update(dbPayload).eq('id', id);
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
