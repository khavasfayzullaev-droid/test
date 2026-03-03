import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const TestContext = createContext();

export const useTests = () => useContext(TestContext);

export const TestProvider = ({ children }) => {
    const [tests, setTests] = useState([]);
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch Folders First
            const { data: folderData, error: folderErr } = await supabase.from('folders')
                .select('*')
                .order('created_at', { ascending: false });

            if (folderErr) console.error("Error fetching folders:", folderErr);
            if (folderData) setFolders(folderData);

            // Fetch Tests
            const { data: testsData, error: testsError } = await supabase.from('tests')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(500);
            if (testsError) console.error('Error fetching tests:', testsError);
            let parsedTests = [];
            if (testsData) {
                parsedTests = testsData.map(t => {
                    let desc = t.description || '';
                    let showAnswers = false;
                    let oneByOne = false;
                    let startTime = null;
                    let endTime = null;
                    let deletedSubs = [];

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

                    const deletedMatch = desc.match(/:::DELETED_SUBS=(\[.*?\]):::/);
                    if (deletedMatch) {
                        try {
                            deletedSubs = JSON.parse(deletedMatch[1]);
                        } catch (e) { }
                        desc = desc.replace(deletedMatch[0], '');
                    }

                    return { ...t, description: desc, showAnswers, oneByOne, startTime, endTime, deletedSubs };
                });
            }
            setTests(parsedTests);

            // Submissions bulk fetching removed for scaling. Submissions are now queried exclusively on demand.
        } catch (err) {
            console.error("Fetch data error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Initial load from Supabase - ideally only called when needed, but keeping for backward compatibility if other places rely on it
    useEffect(() => {
        fetchData();
    }, []);

    // Add a specialized function for targeted fetching
    const fetchTestById = async (id) => {
        try {
            const safeId = id ? id.toUpperCase() : '';
            // First check if it's already in state
            const existing = tests.find(t => t.id === safeId);
            if (existing) return existing;

            setLoading(true);
            const { data, error } = await supabase
                .from('tests')
                .select('*')
                .eq('id', safeId)
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
                let deletedSubs = [];

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

                const deletedMatch = desc.match(/:::DELETED_SUBS=(\[.*?\]):::/);
                if (deletedMatch) {
                    try {
                        deletedSubs = JSON.parse(deletedMatch[1]);
                    } catch (e) { }
                    desc = desc.replace(deletedMatch[0], '');
                }

                // Add to temporary state (or just return it without polluting global state)
                const mappedTest = { ...data, description: desc, showAnswers, oneByOne, startTime, endTime, deletedSubs };

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
            endTime: test.endTime || null,
            deletedSubs: []
        };
        setTests(prev => [...prev, stateTest]);

        const { error } = await supabase.from('tests').insert([newTest]);
        if (error) console.error("Error adding test:", error);

        return newTest.id;
    };

    const deleteTest = async (id) => {
        setTests(prev => prev.filter(t => t.id !== id));

        const { error } = await supabase.from('tests').delete().eq('id', id);
        if (error) console.error("Error deleting test:", error);
    };

    const submitTest = async (submission) => {
        const newSub = {
            testId: submission.testId,
            studentName: submission.studentName,
            deviceId: submission.deviceId || null,
            answers: submission.answers,
            score: submission.score,
            totalQuestions: submission.totalQuestions,
            submittedAt: new Date().toISOString()
        };

        const { error } = await supabase.from('submissions').insert([newSub]);
        if (error) console.error("Error adding submission:", error);
    };

    const deleteSubmission = async (testId, submissionId) => {
        // Soft delete by marking the submission as is_deleted = true
        // This completely avoids touching the tests table, preventing data wiping bugs
        const { error } = await supabase
            .from('submissions')
            .update({ is_deleted: true })
            .eq('id', submissionId);

        if (error) return { error };

        // Also update local state if we were tracking it here (though TestResults refetches usually)
        return { error: null, count: 1 };
    };

    const getSubmissionsForTest = async (testId) => {
        const { data, error } = await supabase
            .from('submissions')
            .select('*')
            .eq('testId', testId)
            // Filter out soft-deleted submissions directly in the query 
            // OR we can filter in JS if the schema change is fresh
            .order('submittedAt', { ascending: false });

        if (error) {
            console.error("Error fetching submissions:", error);
            return [];
        }

        // Support both old deletedSubs array (for legacy tests) and new is_deleted column
        const testObj = await fetchTestById(testId);
        const legacyDeletedList = testObj?.deletedSubs || [];

        return (data || []).filter(sub => !sub.is_deleted && !legacyDeletedList.includes(sub.id));
    };

    const updateTest = async (id, updatedData) => {
        const currentTest = tests.find(t => t.id === id) || {};
        const mergedData = { ...currentTest, ...updatedData };
        let encodedDesc = `${mergedData.description || ''}:::SHOW_ANSWERS=${mergedData.showAnswers === true}::::::ONE_BY_ONE=${mergedData.oneByOne === true}:::`;
        if (mergedData.startTime) encodedDesc += `:::START_TIME=${mergedData.startTime}:::`;
        if (mergedData.endTime) encodedDesc += `:::END_TIME=${mergedData.endTime}:::`;
        if (mergedData.deletedSubs && mergedData.deletedSubs.length > 0) {
            encodedDesc += `:::DELETED_SUBS=${JSON.stringify(mergedData.deletedSubs)}:::`;
        }

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
        delete dbPayload.deletedSubs;

        const { error } = await supabase.from('tests').update(dbPayload).eq('id', id);
        if (error) console.error("Error updating test:", error);
    };

    const hasStudentTaken = async (testId, studentName, deviceId = null) => {
        let query = supabase
            .from('submissions')
            .select('id, studentName, deviceId')
            .eq('testId', testId);

        // Only check by name to prevent the exact same name from taking it twice
        query = query.ilike('studentName', studentName);

        const { data, error } = await query;

        if (error) {
            console.error("Error checking submission status:", error);
            return { taken: false, reason: null };
        }

        if (data && data.length > 0) {
            const testObj = await fetchTestById(testId);
            const legacyDeletedList = testObj?.deletedSubs || [];

            // Filter out any submissions that are deleted (via column or legacy list)
            const activeSubmissions = data.filter(sub => !sub.is_deleted && !legacyDeletedList.includes(sub.id));

            if (activeSubmissions.length > 0) {
                return { taken: true, reason: 'NAME' };
            }
        }
        return { taken: false, reason: null };
    };

    const addFolder = async (name) => {
        try {
            const { data, error } = await supabase
                .from('folders')
                .insert([{ name }])
                .select()
                .single();
            if (error) return { error };
            setFolders(prev => [data, ...prev]);
            return { data };
        } catch (error) {
            return { error };
        }
    };

    const deleteFolder = async (id, folderName) => {
        try {
            // Move tests from this folder to 'Umumiy'
            await supabase.from('tests').update({ category: 'Umumiy' }).eq('category', folderName);

            // Delete the folder
            const { error } = await supabase.from('folders').delete().eq('id', id);
            if (error) return { error };

            // Update local state
            setFolders(prev => prev.filter(f => f.id !== id));
            setTests(prev => prev.map(t => t.category === folderName ? { ...t, category: 'Umumiy' } : t));

            return { error: null };
        } catch (error) {
            return { error };
        }
    };

    const renameFolder = async (id, oldName, newName) => {
        try {
            // Update folder name
            const { error: folderError } = await supabase.from('folders').update({ name: newName }).eq('id', id);
            if (folderError) return { error: folderError };

            // Update associated tests categories
            await supabase.from('tests').update({ category: newName }).eq('category', oldName);

            // Update local state
            setFolders(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
            setTests(prev => prev.map(t => (t.category || 'Umumiy') === oldName ? { ...t, category: newName } : t));

            return { error: null };
        } catch (error) {
            return { error };
        }
    };

    return (
        <TestContext.Provider value={{
            tests,
            folders,
            setFolders,
            loading,
            addTest,
            deleteTest,
            submitTest,
            deleteSubmission,
            getSubmissionsForTest,
            updateTest,
            hasStudentTaken,
            fetchData,
            fetchTestById,
            addFolder,
            deleteFolder,
            renameFolder
        }}>
            {children}
        </TestContext.Provider>
    );
};
