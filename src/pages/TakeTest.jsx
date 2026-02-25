import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTests } from '../context/TestContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { CheckCircle, Clock, AlertTriangle, XCircle, EyeOff } from 'lucide-react';

const TakeTest = () => {
    const { id } = useParams();
    const { fetchTestById, submitTest } = useTests();
    const navigate = useNavigate();
    const location = useLocation();

    const [test, setTest] = useState(null);
    const [loadingTest, setLoadingTest] = useState(true);
    const [studentName, setStudentName] = useState('');
    const [answers, setAnswers] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null);
    const timerRef = useRef(null);
    const submittingRef = useRef(false);

    // One-by-one mode states
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [isCurrentRevealed, setIsCurrentRevealed] = useState(false);

    // Anti-cheat flag
    const [cheatingDetected, setCheatingDetected] = useState(false);

    const calculateScore = useCallback(() => {
        if (!test) return 0;
        let correct = 0;
        test.questions.forEach(q => {
            if (answers[q.id] === q.correctOption) correct++;
        });
        return correct;
    }, [test, answers]);

    const doSubmit = useCallback(async () => {
        if (submittingRef.current) return;
        submittingRef.current = true;

        const finalScore = calculateScore();
        setScore(finalScore);

        try {
            await submitTest({
                testId: test.id,
                studentName,
                answers,
                score: finalScore,
                totalQuestions: test.questions.length
            });

            // Set permanent local device lock against retaking
            localStorage.setItem(`completed_test_${test.id}`, 'true');

            setIsSubmitted(true);
            sessionStorage.removeItem('currentStudentName');
            sessionStorage.removeItem(`test_answers_${test.id}`);
            if (timerRef.current) clearInterval(timerRef.current);
        } catch (err) {
            console.error("Submission failed", err);
            submittingRef.current = false;
        }
    }, [test, studentName, answers, calculateScore, submitTest]);

    useEffect(() => {
        const initTest = async () => {
            const name = sessionStorage.getItem('currentStudentName');

            // Check if passed via React Router state (from DirectTakeTest)
            let foundTest = location.state?.testData;

            // If not in state, fetch it
            if (!foundTest) {
                setLoadingTest(true);
                foundTest = await fetchTestById(id);
            }

            if (!foundTest || !name) {
                navigate(`/take/${id}`);
                return;
            }

            setTest(foundTest);
            setStudentName(name);

            // Initialize answers from session storage if available
            const savedAnswersStr = sessionStorage.getItem(`test_answers_${id}`);
            let initialAnswers = {};
            if (savedAnswersStr) {
                try {
                    initialAnswers = JSON.parse(savedAnswersStr);
                } catch (e) {
                    console.error("Failed to parse saved answers");
                }
            } else {
                foundTest.questions.forEach(q => initialAnswers[q.id] = null);
            }
            setAnswers(initialAnswers);

            // Calculate timer based on individual time limit AND global end time
            let calculatedTimeLeft = null;
            if (foundTest.timeLimit && foundTest.timeLimit > 0) {
                calculatedTimeLeft = foundTest.timeLimit * 60; // convert minutes to seconds
            }

            if (foundTest.endTime) {
                const end = new Date(foundTest.endTime).getTime();
                const now = Date.now();
                const secondsUntilEnd = Math.max(0, Math.floor((end - now) / 1000));

                if (calculatedTimeLeft === null || secondsUntilEnd < calculatedTimeLeft) {
                    calculatedTimeLeft = secondsUntilEnd;
                }
            }

            if (calculatedTimeLeft !== null) {
                setTimeLeft(calculatedTimeLeft);
            }
            setLoadingTest(false);
        };

        initTest();
    }, [id, fetchTestById, navigate, location.state]);

    // Countdown timer effect
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || isSubmitted) return;

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [timeLeft, isSubmitted]);

    // Auto-submit when timer reaches 0
    useEffect(() => {
        if (timeLeft === 0 && !isSubmitted && test) {
            alert('⏰ Vaqt tugadi! Test avtomatik yakunlanmoqda...');
            doSubmit();
        }
    }, [timeLeft, isSubmitted, test, doSubmit]);

    // ANTI-CHEAT: Page Visibility API
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && !isSubmitted && test) {
                // The student switched tabs or minimized the browser!
                setCheatingDetected(true);
                doSubmit();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Also listen to blur events (losing window focus) as an extra measure
        window.addEventListener('blur', handleVisibilityChange);

        // Warn before accidental reload/close
        const handleBeforeUnload = (e) => {
            if (!isSubmitted && test) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isSubmitted, test, doSubmit]);

    if (loadingTest || !test) return <div style={{ textAlign: 'center', padding: '4rem' }}><div className="loading-spinner" style={{ margin: '0 auto' }}></div><p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Yuklanmoqda...</p></div>;

    const handleSelectAnswer = (questionId, optionIndex) => {
        if (test?.oneByOne && isCurrentRevealed) return; // Prevent changing after revealing

        const nextAnswers = { ...answers, [questionId]: optionIndex };
        setAnswers(nextAnswers);
        sessionStorage.setItem(`test_answers_${test.id}`, JSON.stringify(nextAnswers));

        if (test?.oneByOne) {
            setIsCurrentRevealed(true);
        }
    };

    const handleNextQuestion = () => {
        if (currentQIndex < test.questions.length - 1) {
            setCurrentQIndex(prev => prev + 1);
            setIsCurrentRevealed(false);
        } else {
            doSubmit();
        }
    };

    const handleSubmit = () => {
        const unanswered = Object.values(answers).some(a => a === null);
        if (unanswered) {
            const confirmSubmit = window.confirm("Ba'zi savollarga javob bermadingiz. Baribir yakunlaysizmi?");
            if (!confirmSubmit) return;
        }
        doSubmit();
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (isSubmitted) {
        const percentage = Math.round((score / test.questions.length) * 100);
        return (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '60vh', padding: '2rem 1rem 4rem' }}>
                <Card glass style={{ maxWidth: '500px', width: '100%', textAlign: 'center', marginBottom: '2rem' }}>
                    <CardContent style={{ padding: '3rem 2rem' }}>
                        {cheatingDetected ? (
                            <>
                                <EyeOff size={64} color="var(--danger)" style={{ margin: '0 auto 1.5rem' }} />
                                <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--danger)' }}>Qoidabuzarlik aniqlandi!</h2>
                                <p className="text-muted" style={{ marginBottom: '2rem' }}>Siz test sahifasidan chiqib ketdingiz yoki boshqa oynaga o'tdingiz. Test jarayoni avtomatik tarzda yakunlandi.</p>
                            </>
                        ) : (
                            <>
                                <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 1.5rem' }} />
                                <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Test Yakunlandi!</h2>
                                <p className="text-muted" style={{ marginBottom: '2rem' }}>Natijangiz ustozingizga yuborildi.</p>
                            </>
                        )}

                        <div style={{ background: 'var(--bg-main)', padding: '2rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--primary)', lineHeight: 1 }}>{percentage}%</div>
                            <div style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginTop: '0.5rem' }}>
                                {score} ta to'g'ri (Jami {test.questions.length} ta)
                            </div>
                        </div>

                        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', fontWeight: 500 }}>
                            Test yakunlandi. Agar natijalarni ko'rib bo'lgan bo'lsangiz, ushbu sahifani yopishingiz mumkin.
                        </div>
                    </CardContent>
                </Card>

                {test.showAnswers && (
                    <div style={{ maxWidth: '800px', width: '100%' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>Javoblar Tahlili</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {test.questions.map((q, index) => {
                                const stAns = answers[q.id];
                                const isCorrect = stAns === q.correctOption;
                                return (
                                    <Card key={q.id} style={{ borderLeft: `4px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'}` }}>
                                        <CardHeader title={
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                {isCorrect ? <CheckCircle size={20} color="var(--success)" style={{ marginTop: '2px' }} /> : <XCircle size={20} color="var(--danger)" style={{ marginTop: '2px' }} />}
                                                <span>{index + 1}. {q.text}</span>
                                            </div>
                                        } />
                                        <CardContent>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {q.image && (
                                                    <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                                                        <img src={q.image} alt="Question figure" style={{ maxHeight: '250px', maxWidth: '100%', objectFit: 'contain', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }} />
                                                    </div>
                                                )}
                                                {q.options.map((opt, optIndex) => {
                                                    let isStudentChoice = stAns === optIndex;
                                                    let isActualCorrect = q.correctOption === optIndex;

                                                    let bgColor = 'white';
                                                    let borderColor = 'var(--border-strong)';
                                                    let textColor = 'var(--text-main)';

                                                    if (isActualCorrect) {
                                                        bgColor = 'rgba(0,184,148,0.1)';
                                                        borderColor = 'var(--success)';
                                                        textColor = 'var(--success)';
                                                    } else if (isStudentChoice && !isActualCorrect) {
                                                        bgColor = 'rgba(255,118,117,0.1)';
                                                        borderColor = 'var(--danger)';
                                                        textColor = 'var(--danger)';
                                                    }

                                                    return (
                                                        <div key={optIndex} style={{
                                                            padding: '1rem',
                                                            borderRadius: 'var(--radius-sm)',
                                                            border: `1px solid ${borderColor}`,
                                                            background: bgColor,
                                                            color: textColor,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.75rem',
                                                            fontWeight: isActualCorrect ? 600 : 400
                                                        }}>
                                                            <div style={{
                                                                width: '20px', height: '20px', borderRadius: '50%',
                                                                border: `2px solid ${borderColor}`,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                background: isStudentChoice ? borderColor : 'transparent'
                                                            }}>
                                                                {isStudentChoice && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                                                            </div>
                                                            {opt}
                                                            {isActualCorrect && <span style={{ marginLeft: 'auto', fontSize: '0.85rem', background: 'var(--success)', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>To'g'ri javob</span>}
                                                            {isStudentChoice && !isActualCorrect && <span style={{ marginLeft: 'auto', fontSize: '0.85rem', background: 'var(--danger)', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>Sizning javobingiz</span>}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const isTimerWarning = timeLeft !== null && timeLeft < 60;

    return (
        <div
            className="fade-in"
            style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem', userSelect: 'none', WebkitUserSelect: 'none' }}
            onCopy={(e) => { e.preventDefault(); alert("Diqqat! Test savollaridan nusxa ko'chirish qat'iyan man etiladi."); }}
            onCut={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
            onContextMenu={(e) => { e.preventDefault(); alert("Test vaqtida sichqonchaning o'ng tugmasidan foydalanish bloklangan."); }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{test.title}</h2>
                    <p className="text-muted">{studentName} — Omad tilaymiz!</p>
                </div>
                {timeLeft !== null ? (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: isTimerWarning ? 'var(--danger)' : 'var(--warning)',
                        color: isTimerWarning ? 'white' : '#856404',
                        padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', fontWeight: 700,
                        fontSize: '1.1rem',
                        animation: isTimerWarning ? 'pulse 1s infinite' : 'none'
                    }}>
                        {isTimerWarning ? <AlertTriangle size={18} /> : <Clock size={16} />}
                        {formatTime(timeLeft)}
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--warning)', color: '#856404', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                        <Clock size={16} /> Vaqt cheklanmagan
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {test.oneByOne ? (
                    (() => {
                        const q = test.questions[currentQIndex];
                        const index = currentQIndex;
                        const stAns = answers[q.id];
                        return (
                            <Card key={q.id} glass style={{ borderLeft: isCurrentRevealed ? `4px solid ${stAns === q.correctOption ? 'var(--success)' : 'var(--danger)'}` : 'none' }}>
                                <CardHeader title={
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                        {isCurrentRevealed && (stAns === q.correctOption ? <CheckCircle size={20} color="var(--success)" style={{ marginTop: '2px' }} /> : <XCircle size={20} color="var(--danger)" style={{ marginTop: '2px' }} />)}
                                        <span>{index + 1}. {q.text}</span>
                                    </div>
                                } />
                                <CardContent>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {q.image && (
                                            <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                                                <img src={q.image} alt="Question figure" style={{ maxHeight: '300px', maxWidth: '100%', objectFit: 'contain', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }} />
                                            </div>
                                        )}
                                        {q.options.map((opt, optIndex) => {
                                            const isSelected = stAns === optIndex;
                                            let isActualCorrect = q.correctOption === optIndex;

                                            let bgColor = isSelected ? 'rgba(74, 144, 226, 0.05)' : 'white';
                                            let borderColor = isSelected ? 'var(--primary)' : 'var(--border-strong)';
                                            let textColor = isSelected ? 'var(--primary-dark)' : 'var(--text-main)';

                                            if (isCurrentRevealed) {
                                                if (isActualCorrect) {
                                                    bgColor = 'rgba(0,184,148,0.1)';
                                                    borderColor = 'var(--success)';
                                                    textColor = 'var(--success)';
                                                } else if (isSelected && !isActualCorrect) {
                                                    bgColor = 'rgba(255,118,117,0.1)';
                                                    borderColor = 'var(--danger)';
                                                    textColor = 'var(--danger)';
                                                }
                                            }

                                            return (
                                                <button
                                                    key={optIndex}
                                                    onClick={() => handleSelectAnswer(q.id, optIndex)}
                                                    disabled={isCurrentRevealed}
                                                    style={{
                                                        padding: '1rem',
                                                        textAlign: 'left',
                                                        borderRadius: 'var(--radius-sm)',
                                                        border: `1px solid ${borderColor}`,
                                                        background: bgColor,
                                                        color: textColor,
                                                        transition: 'all var(--transition-fast)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '1rem',
                                                        cursor: isCurrentRevealed ? 'default' : 'pointer',
                                                        fontWeight: isCurrentRevealed && isActualCorrect ? 600 : 400
                                                    }}
                                                    className={!isCurrentRevealed ? "hover:shadow-sm" : ""}
                                                >
                                                    <div style={{
                                                        width: '24px', height: '24px', borderRadius: '50%',
                                                        border: `2px solid ${borderColor}`,
                                                        background: isSelected && !isCurrentRevealed ? 'var(--primary)' : 'transparent',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        flexShrink: 0
                                                    }}>
                                                        {isSelected && !isCurrentRevealed && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'white' }} />}
                                                        {isCurrentRevealed && isSelected && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: borderColor }} />}
                                                    </div>
                                                    <span style={{ fontSize: '1.05rem', color: textColor }}>
                                                        {opt}
                                                    </span>
                                                    {isCurrentRevealed && isActualCorrect && <span style={{ marginLeft: 'auto', fontSize: '0.85rem', background: 'var(--success)', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '1rem' }}>To'g'ri javob</span>}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {isCurrentRevealed && (
                                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                                            <Button variant="primary" size="lg" onClick={handleNextQuestion}>
                                                {currentQIndex < test.questions.length - 1 ? 'Keyingi savol ➔' : 'Testni Yakunlash'}
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })()
                ) : (
                    test.questions.map((q, index) => (
                        <Card key={q.id} glass>
                            <CardHeader title={`${index + 1}. ${q.text}`} />
                            <CardContent>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {q.image && (
                                        <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                                            <img src={q.image} alt="Question figure" style={{ maxHeight: '300px', maxWidth: '100%', objectFit: 'contain', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }} />
                                        </div>
                                    )}
                                    {q.options.map((opt, optIndex) => {
                                        const isSelected = answers[q.id] === optIndex;
                                        return (
                                            <button
                                                key={optIndex}
                                                onClick={() => handleSelectAnswer(q.id, optIndex)}
                                                style={{
                                                    padding: '1rem',
                                                    textAlign: 'left',
                                                    borderRadius: 'var(--radius-sm)',
                                                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-strong)'}`,
                                                    background: isSelected ? 'rgba(74, 144, 226, 0.05)' : 'white',
                                                    transition: 'all var(--transition-fast)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '1rem'
                                                }}
                                                className="hover:shadow-sm"
                                            >
                                                <div style={{
                                                    width: '24px', height: '24px', borderRadius: '50%',
                                                    border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border-strong)'}`,
                                                    background: isSelected ? 'var(--primary)' : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    {isSelected && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'white' }} />}
                                                </div>
                                                <span style={{ fontSize: '1.05rem', color: isSelected ? 'var(--primary-dark)' : 'var(--text-main)' }}>
                                                    {opt}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {!test.oneByOne && (
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg-glass)', backdropFilter: 'blur(16px)', padding: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 500 }}>
                            Belgilangan: <span style={{ color: 'var(--primary)' }}>{Object.values(answers).filter(a => a !== null).length}</span> / {test.questions.length}
                        </div>
                        <Button variant="primary" size="lg" onClick={handleSubmit}>
                            Testni Yakunlash
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TakeTest;
