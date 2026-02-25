import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTests } from '../context/TestContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { ArrowLeft, Download, Trophy, Target, AlertTriangle, Trash2 } from 'lucide-react';

const TestResults = () => {
    const { id } = useParams();
    const { tests, getSubmissionsForTest, deleteSubmission, loading } = useTests();
    const navigate = useNavigate();

    const [test, setTest] = useState(null);
    const [submissions, setSubmissions] = useState([]);

    const handleDeleteSubmission = async (subId, stName) => {
        if (!window.confirm(`Rostdan ham ${stName} ismli o'quvchining natijasini o'chirib tashlamoqchimisiz?`)) return;

        const { error, count } = await deleteSubmission(subId);

        if (error) {
            alert(`O'chirishda xatolik yuz berdi: ${error.message}`);
            return;
        }

        if (count === 0) {
            alert("⚠️ Supabase xavfsizlik (RLS) tizimi bu o'quvchini o'chirishga ruxsat bermadi. Baza qoidalari (Policies) to'liq yoqilmagan.");
            return; // Don't filter state if db deletion didn't happen
        }

        setSubmissions(prev => prev.filter(s => s.id !== subId));
    };

    useEffect(() => {
        if (loading) return; // Wait for data to fetch

        const foundTest = tests.find(t => t.id === id);
        if (!foundTest) {
            navigate('/teacher');
            return;
        }
        setTest(foundTest);

        const fetchSubmissions = async () => {
            const subs = await getSubmissionsForTest(id);
            // Sort by score descending
            subs.sort((a, b) => b.score - a.score);
            setSubmissions(subs);
        };
        fetchSubmissions();
    }, [id, tests, getSubmissionsForTest, navigate, loading]);

    if (!test) return <div style={{ textAlign: 'center', padding: '4rem' }}><div className="loading-spinner" style={{ margin: '0 auto' }}></div><p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Yuklanmoqda...</p></div>;

    const averageScore = submissions.length > 0
        ? Math.round(submissions.reduce((acc, curr) => acc + curr.score, 0) / submissions.length)
        : 0;

    const averagePercentage = submissions.length > 0
        ? Math.round((averageScore / test.questions.length) * 100)
        : 0;

    let hardestQuestion = null;
    let easiestQuestion = null;

    if (submissions.length > 0 && test.questions.length > 0) {
        const questionStats = test.questions.map((q, index) => {
            let correctCount = 0;
            submissions.forEach(sub => {
                if (sub.answers[q.id] === q.correctOption) {
                    correctCount++;
                }
            });
            return {
                index: index + 1,
                text: q.text,
                correctCount,
                percent: Math.round((correctCount / submissions.length) * 100)
            };
        });

        // Sort by correct percentage descending
        questionStats.sort((a, b) => b.percent - a.percent);
        easiestQuestion = questionStats[0];
        hardestQuestion = questionStats[questionStats.length - 1];
    }

    return (
        <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                <Button variant="ghost" onClick={() => navigate('/teacher')} style={{ marginRight: '1rem', padding: '0.5rem' }}>
                    <ArrowLeft size={24} />
                </Button>
                <div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Natijalar: {test.title}</h2>
                    <p className="text-muted">Jami qatnashchilar: {submissions.length} ta o'quvchi</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <Card glass style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', color: 'white' }}>
                    <CardContent style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '1rem', opacity: 0.9, fontWeight: 500 }}>O'rtacha Ball</h3>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{averageScore} <span style={{ fontSize: '1.5rem', opacity: 0.8 }}>/ {test.questions.length}</span></div>
                    </CardContent>
                </Card>

                <Card glass style={{ background: 'linear-gradient(135deg, var(--success) 0%, #009376 100%)', color: 'white' }}>
                    <CardContent style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '1rem', opacity: 0.9, fontWeight: 500 }}>O'zlashtirish Foizi</h3>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{averagePercentage}%</div>
                    </CardContent>
                </Card>

                {submissions.length > 0 && easiestQuestion && (
                    <Card glass style={{ borderLeft: '4px solid var(--success)' }}>
                        <CardContent style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--success)' }}>
                                <Target size={18} />
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Eng Oson</h3>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem', color: 'var(--text-main)' }}>{easiestQuestion.index}-savol</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{easiestQuestion.percent}% o'quvchi topgan</div>
                        </CardContent>
                    </Card>
                )}

                {submissions.length > 0 && hardestQuestion && (
                    <Card glass style={{ borderLeft: '4px solid var(--danger)' }}>
                        <CardContent style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--danger)' }}>
                                <AlertTriangle size={18} />
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Eng Qiyin</h3>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem', color: 'var(--text-main)' }}>{hardestQuestion.index}-savol</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Faqat {hardestQuestion.percent}% o'quvchi topgan</div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Card glass>
                <CardHeader
                    title="O'quvchilar ro'yxati"
                    action={
                        <Button variant="outline" size="sm" onClick={() => window.print()}>
                            <Download size={16} style={{ marginRight: '0.5rem' }} /> PDF yoki Excel yuklab olish
                        </Button>
                    }
                />
                <CardContent style={{ padding: 0 }}>
                    {submissions.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Hali hech kim ushbu testni ishlamadi.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-strong)', background: 'rgba(0,0,0,0.02)' }}>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>T/R</th>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Ism Familiya</th>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>To'g'ri Javoblar</th>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Foiz</th>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Topshirilgan Vaqt</th>
                                        <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Amallar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.map((sub, idx) => {
                                        const percentage = Math.round((sub.score / test.questions.length) * 100);
                                        let rowColor = 'inherit';
                                        if (idx === 0 && percentage > 0) rowColor = 'rgba(253, 203, 110, 0.1)'; // Gold for 1st
                                        else if (percentage < 50) rowColor = 'rgba(255, 118, 117, 0.05)'; // Red for low score

                                        return (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: rowColor }}>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    {idx === 0 && percentage > 0 ? <Trophy size={18} color="var(--warning)" /> : (idx + 1)}
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{sub.studentName}</td>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    <span style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{sub.score}</span> / {test.questions.length}
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{ width: '100px', height: '6px', background: 'var(--border-strong)', borderRadius: '3px', overflow: 'hidden' }}>
                                                            <div style={{
                                                                height: '100%',
                                                                width: `${percentage}%`,
                                                                background: percentage >= 80 ? 'var(--success)' : percentage >= 50 ? 'var(--primary)' : 'var(--danger)'
                                                            }} />
                                                        </div>
                                                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{percentage}%</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                    {new Date(sub.submittedAt).toLocaleString('uz-UZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteSubmission(sub.id, sub.studentName)} style={{ color: 'var(--danger)', padding: '0.25rem' }}>
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {submissions.length > 0 && (
                <Card glass style={{ marginTop: '2rem' }}>
                    <CardHeader title="Savollar Tahlili (Qiyinlik darajasi)" />
                    <CardContent>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {test.questions.map((q, index) => {
                                // Calculate how many chose each option
                                const optionCounts = q.options.map(() => 0);
                                let skipped = 0;

                                submissions.forEach(sub => {
                                    const chosen = sub.answers[q.id];
                                    if (chosen === null || chosen === undefined) {
                                        skipped++;
                                    } else {
                                        optionCounts[chosen]++;
                                    }
                                });

                                const correctCount = optionCounts[q.correctOption];
                                const correctPercent = Math.round((correctCount / submissions.length) * 100);

                                return (
                                    <div key={q.id} style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem' }}>
                                        <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 600 }}>
                                            {index + 1}. {q.text}
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                            {q.options.map((opt, optIdx) => {
                                                const count = optionCounts[optIdx];
                                                const percent = Math.round((count / submissions.length) * 100);
                                                const isCorrect = optIdx === q.correctOption;

                                                return (
                                                    <div key={optIdx} style={{
                                                        padding: '0.75rem',
                                                        borderRadius: 'var(--radius-sm)',
                                                        border: `1px solid ${isCorrect ? 'var(--success)' : 'var(--border-light)'}`,
                                                        background: isCorrect ? 'rgba(0,184,148,0.05)' : 'var(--bg-main)',
                                                        position: 'relative',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            position: 'absolute', top: 0, left: 0, bottom: 0,
                                                            width: `${percent}%`,
                                                            background: isCorrect ? 'rgba(0,184,148,0.1)' : 'rgba(0,0,0,0.03)',
                                                            zIndex: 0
                                                        }} />
                                                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ fontWeight: isCorrect ? 600 : 400 }}>{opt} {isCorrect && '✅'}</span>
                                                            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{count} kishi ({percent}%)</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {skipped > 0 && <p style={{ fontSize: '0.85rem', color: 'var(--warning)', marginTop: '0.5rem' }}>⚠️ {skipped} ta o'quvchi ushbu savolni o'tkazib yuborgan.</p>}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default TestResults;
