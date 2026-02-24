import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTests } from '../context/TestContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';

const TakeTest = () => {
    const { id } = useParams();
    const { tests, submitTest, loading } = useTests();
    const navigate = useNavigate();

    const [test, setTest] = useState(null);
    const [studentName, setStudentName] = useState('');
    const [answers, setAnswers] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null); // in seconds
    const timerRef = useRef(null);

    // One-by-one mode states
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [isCurrentRevealed, setIsCurrentRevealed] = useState(false);

    const calculateScore = useCallback(() => {
        if (!test) return 0;
        let correct = 0;
        test.questions.forEach(q => {
            if (answers[q.id] === q.correctOption) correct++;
        });
        return correct;
    }, [test, answers]);

    const doSubmit = useCallback(async () => {
        const finalScore = calculateScore();
        setScore(finalScore);

        await submitTest({
            testId: test.id,
            studentName,
            answers,
            score: finalScore,
            totalQuestions: test.questions.length
        });

        setIsSubmitted(true);
        sessionStorage.removeItem('currentStudentName');
        if (timerRef.current) clearInterval(timerRef.current);
    }, [test, studentName, answers, calculateScore, submitTest]);

    useEffect(() => {
        if (loading) return; // Wait for data to fetch

        const foundTest = tests.find(t => t.id.toUpperCase() === id.toUpperCase());
        const name = sessionStorage.getItem('currentStudentName');

        if (!foundTest || !name) {
            navigate(`/take/${id}`);
            return;
        }

        setTest(foundTest);
        setStudentName(name);

        // Initialize answers
        const initialAnswers = {};
        foundTest.questions.forEach(q => initialAnswers[q.id] = null);
        setAnswers(initialAnswers);

        // Start timer if timeLimit is set
        if (foundTest.timeLimit && foundTest.timeLimit > 0) {
            setTimeLeft(foundTest.timeLimit * 60); // convert minutes to seconds
        }
    }, [id, tests, navigate, loading]);

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

    if (!test) return <div style={{ textAlign: 'center', padding: '4rem' }}>Yuklanmoqda...</div>;

    const handleSelectAnswer = (questionId, optionIndex) => {
        if (test?.oneByOne && isCurrentRevealed) return; // Prevent changing after revealing
        setAnswers({ ...answers, [questionId]: optionIndex });
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
                        <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 1.5rem' }} />
                        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Test Yakunlandi!</h2>
                        <p className="text-muted" style={{ marginBottom: '2rem' }}>Natijangiz ustozingizga yuborildi.</p>

                        <div style={{ background: 'var(--bg-main)', padding: '2rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--primary)', lineHeight: 1 }}>{percentage}%</div>
                            <div style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginTop: '0.5rem' }}>
                                {score} ta to'g'ri (Jami {test.questions.length} ta)
                            </div>
                        </div>

                        <Button variant="primary" fullWidth onClick={() => navigate('/')}>
                            Bosh sahifaga qaytish
                        </Button>
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
        <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
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
