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
                        let oneByOne = false;
                        let startTime = null;
                        let endTime = null;

                        if (desc.includes(':::SHOW_ANSWERS=true:::')) {
                            showAnswers = true;
                            desc = desc.replace(':::SHOW_ANSWERS=true:::', '');
                        } else if (desc.includes(':::SHOW_ANSWERS=false:::')) {
                            showAnswers = false;
                            desc = desc.replace(':::SHOW_ANSWERS=false:::', '');
                        }

                        if (desc.includes(':::ONE_BY_ONE=true:::')) {
                            oneByOne = true;
                            desc = desc.replace(':::ONE_BY_ONE=true:::', '');
                        } else if (desc.includes(':::ONE_BY_ONE=false:::')) {
                            oneByOne = false;
                            desc = desc.replace(':::ONE_BY_ONE=false:::', '');
                        }

                        const startMatch = desc.match(/:::START_TIME=([^:]+):::/);
                        if (startMatch) {
                            startTime = startMatch[1];
                            desc = desc.replace(startMatch[0], '');
                        }

                        const endMatch = desc.match(/:::END_TIME=([^:]+):::/);
                        if (endMatch) {
                            endTime = endMatch[1];
                            desc = desc.replace(endMatch[0], '');
                        }

                        return { ...t, description: desc, showAnswers, oneByOne, startTime, endTime };
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

    // Add a specialized function for targeted fetching
    const fetchTestById = async (id) => {
        try {
            // First check if it's already in state
            const existing = tests.find(t => t.id === id);
            if (existing) return existing;

            setLoading(true);
            const { data, error } = await supabase
                .from('tests')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching single test:', error);
                return null;
            }

            if (data) {
                let desc = data.description || '';
                let showAnswers = false;
                let oneByOne = false;
                let startTime = null;
                let endTime = null;

                const ansMatch = desc.match(/:::SHOW_ANSWERS=(true|false):::/);
                if (ansMatch) {
                    showAnswers = ansMatch[1] === 'true';
                    desc = desc.replace(ansMatch[0], '');
                }

                const oneByOneMatch = desc.match(/:::ONE_BY_ONE=(true|false):::/);
                if (oneByOneMatch) {
                    oneByOne = oneByOneMatch[1] === 'true';
                    desc = desc.replace(oneByOneMatch[0], '');
                }

                const startMatch = desc.match(/:::START_TIME=([^:]+):::/);
                if (startMatch) {
                    startTime = startMatch[1];
                    desc = desc.replace(startMatch[0], '');
                }

                const endMatch = desc.match(/:::END_TIME=([^:]+):::/);
                if (endMatch) {
                    endTime = endMatch[1];
                    desc = desc.replace(endMatch[0], '');
                }

                // Add to temporary state (or just return it without polluting global state)
                const mappedTest = { ...data, description: desc, showAnswers, oneByOne, startTime, endTime };

                // Optional: Update global state or just return
                // setTests(prev => [...prev.filter(t => t.id !== id), mappedTest]);

                return mappedTest;
            }
        } catch (err) {
            console.error('Unexpected error fetching single test:', err);
        } finally {
            setLoading(false);
        }
        return null;
    };

    const addTest = async (test) => {
        let encodedDesc = `${test.description || ''}:::SHOW_ANSWERS=${test.showAnswers === true}::::::ONE_BY_ONE=${test.oneByOne === true}:::`;
        if (test.startTime) encodedDesc += `:::START_TIME=${test.startTime}:::`;
        if (test.endTime) encodedDesc += `:::END_TIME=${test.endTime}:::`;

        const newTest = {
            id: Math.random().toString(36).substring(2, 9).toUpperCase(),
            title: test.title || '',
            description: encodedDesc,
            category: test.category || 'Umumiy',
            questions: test.questions || [],
            timeLimit: test.timeLimit || 0,
            created_at: new Date().toISOString()
        };

        const stateTest = {
            ...newTest,
            description: test.description || '',
            showAnswers: test.showAnswers === true,
            oneByOne: test.oneByOne === true,
            startTime: test.startTime || null,
            endTime: test.endTime || null
        };
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
        let encodedDesc = `${mergedData.description || ''}:::SHOW_ANSWERS=${mergedData.showAnswers === true}::::::ONE_BY_ONE=${mergedData.oneByOne === true}:::`;
        if (mergedData.startTime) encodedDesc += `:::START_TIME=${mergedData.startTime}:::`;
        if (mergedData.endTime) encodedDesc += `:::END_TIME=${mergedData.endTime}:::`;

        // Update local React state with pure data (no encoding)
        setTests(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));

        // Prepare payload for Supabase (with encoded description and without custom booleans/times)
        const dbPayload = { ...updatedData };
        if (updatedData.hasOwnProperty('description') || updatedData.hasOwnProperty('showAnswers') || updatedData.hasOwnProperty('oneByOne') || updatedData.hasOwnProperty('startTime') || updatedData.hasOwnProperty('endTime')) {
            dbPayload.description = encodedDesc;
        }
        delete dbPayload.showAnswers;
        delete dbPayload.oneByOne;
        delete dbPayload.startTime;
        delete dbPayload.endTime;

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
            hasStudentTaken,
            fetchData,
            fetchTestById
        }}>
            {children}
        </TestContext.Provider>
    );
};
