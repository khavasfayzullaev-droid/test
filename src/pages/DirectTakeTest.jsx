import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTests } from '../context/TestContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Clock, AlertTriangle } from 'lucide-react';

const DirectTakeTest = () => {
    const { id } = useParams();
    const { tests, hasStudentTaken, loading } = useTests();
    const navigate = useNavigate();

    const [test, setTest] = useState(null);
    const [name, setName] = useState('');
    const [alreadyTaken, setAlreadyTaken] = useState(false);
    const [timeStatus, setTimeStatus] = useState({ isValid: true, message: '' });

    useEffect(() => {
        if (loading) return; // Wait for data to fetch

        const foundTest = tests.find(t => t.id.toUpperCase() === id.toUpperCase());
        if (!foundTest) {
            alert('Bunday test topilmadi!');
            navigate('/');
            return;
        }
        setTest(foundTest);
    }, [id, tests, navigate, loading]);

    // Check time constraints
    useEffect(() => {
        if (!test) return;

        const checkTime = () => {
            const now = new Date();

            if (test.startTime) {
                const start = new Date(test.startTime);
                if (now < start) {
                    setTimeStatus({ isValid: false, message: `Test hali boshlanmadi.\nBoshlanish vaqti: ${start.toLocaleString('uz-UZ', { dateStyle: 'long', timeStyle: 'short' })}` });
                    return;
                }
            }

            if (test.endTime) {
                const end = new Date(test.endTime);
                if (now > end) {
                    setTimeStatus({ isValid: false, message: `Test yakunlangan.\nTugash vaqti: ${end.toLocaleString('uz-UZ', { dateStyle: 'long', timeStyle: 'short' })}` });
                    return;
                }
            }

            setTimeStatus({ isValid: true, message: '' });
        };

        checkTime();
        const interval = setInterval(checkTime, 10000); // Re-check every 10 seconds
        return () => clearInterval(interval);
    }, [test]);

    const handleStart = (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        // Check if this student already took the test
        if (hasStudentTaken(test.id, name.trim())) {
            setAlreadyTaken(true);
            return;
        }

        sessionStorage.setItem('currentStudentName', name.trim());
        navigate(`/student/test/${id}`);
    };

    if (!test) return null;

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }} className="fade-in">
            <Card style={{ maxWidth: '450px', width: '100%', borderTop: '4px solid var(--primary)' }}>
                <CardHeader
                    title={test.title}
                    subtitle={`Kategoriya: ${(test.category || 'Umumiy')} • Jami ${test.questions.length} ta savol`}
                />
                <CardContent style={{ paddingTop: '2rem' }}>
                    {test.timeLimit > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(253,203,110,0.15)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', color: '#856404', fontWeight: 500 }}>
                            <Clock size={18} />
                            Vaqt chegarasi: {test.timeLimit} daqiqa
                        </div>
                    )}

                    {alreadyTaken ? (
                        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                            <AlertTriangle size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--danger)' }}>Siz bu testni allaqachon ishlagansiz!</h3>
                            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Har bir o'quvchi testni faqat bir marta ishlashi mumkin.</p>
                            <Button variant="outline" onClick={() => { setAlreadyTaken(false); setName(''); }}>
                                Boshqa ism bilan urinib ko'rish
                            </Button>
                        </div>
                    ) : !timeStatus.isValid ? (
                        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                            <AlertTriangle size={48} color="var(--warning)" style={{ margin: '0 auto 1rem' }} />
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#856404' }}>Kirish yopilgan!</h3>
                            <p className="text-muted" style={{ whiteSpace: 'pre-line' }}>{timeStatus.message}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleStart} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <Input
                                    label="F. I. Sh. / Ismingiz"
                                    placeholder="Masalan: To'rayev Alisher"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <Button variant="primary" type="submit" size="lg" disabled={!name.trim()}>
                                Testni Boshlash
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default DirectTakeTest;
