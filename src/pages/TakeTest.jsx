import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTests } from '../context/TestContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const TakeTest = () => {
    const { id } = useParams();
    const { tests, submitTest } = useTests();
    const navigate = useNavigate();

    const [test, setTest] = useState(null);
    const [studentName, setStudentName] = useState('');
    const [answers, setAnswers] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null); // in seconds
    const timerRef = useRef(null);

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
    }, [id, tests, navigate]);

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
        setAnswers({ ...answers, [questionId]: optionIndex });
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
            <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Card glass style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
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
                {test.questions.map((q, index) => (
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
                ))}
            </div>

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
        </div>
    );
};

export default TakeTest;
