import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTests } from '../context/TestContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Clock, AlertTriangle } from 'lucide-react';
import { generateDeviceFingerprint } from '../lib/fingerprint';

const DirectTakeTest = () => {
    const { id } = useParams();
    const { fetchTestById, hasStudentTaken } = useTests();
    const navigate = useNavigate();

    const [test, setTest] = useState(null);
    const [loadingTest, setLoadingTest] = useState(true);
    const [name, setName] = useState('');
    const [alreadyTaken, setAlreadyTaken] = useState(false);
    const [timeStatus, setTimeStatus] = useState({ isValid: true, message: '' });
    const [isStarting, setIsStarting] = useState(false);

    useEffect(() => {
        const loadSingleTest = async () => {
            setLoadingTest(true);
            const foundTest = await fetchTestById(id);
            if (!foundTest) {
                alert('Bunday test topilmadi!');
                navigate('/');
                return;
            }
            setTest(foundTest);
            setLoadingTest(false);
        };
        loadSingleTest();
    }, [id, fetchTestById, navigate]);

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

    const handleStart = async (e) => {
        e.preventDefault();
        if (!name.trim() || isStarting) return;

        setIsStarting(true);

        try {
            // Check if this student already took the test by name
            const deviceId = await generateDeviceFingerprint();
            const { taken } = await hasStudentTaken(test.id, name.trim(), deviceId);

            if (taken) {
                alert("⚠️ Ushbu ism bilan test allaqachon topshirilgan!\n\nIltimos, ismingiz yoniga familiyangizni ham qo'shing (Masalan: Ali Valiyev). Namunadagidek farqli ism kiritsangizgina tizim sizni qabul qiladi.");
                setIsStarting(false);
                return;
            }

            sessionStorage.setItem('currentStudentName', name.trim());
            navigate(`/student/test/${test.id}`, { state: { testData: test, studentName: name.trim(), deviceId } });
        } catch (error) {
            console.error("Xatolik:", error);
            alert("Ulanishda xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
            setIsStarting(false);
        }
    };

    if (loadingTest || !test) {
        return <div style={{ textAlign: 'center', padding: '4rem' }}><div className="loading-spinner" style={{ margin: '0 auto' }}></div><p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Test qidirilmoqda...</p></div>;
    }

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
                            <div style={{ background: 'rgba(231, 76, 60, 0.05)', border: '1px solid rgba(231, 76, 60, 0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0', color: 'var(--danger)', fontSize: '0.9rem' }}>
                                    <AlertTriangle size={16} /> Qat'iy Qoidalar:
                                </h4>
                                <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    <li>Testni faqat <strong>1 marta</strong> ishlash mumkin.</li>
                                    <li>Test vaqtida <strong>boshqa sahifaga o'tsangiz</strong>, test avtomatik yopiladi va 0 ball qo'yiladi.</li>
                                    <li>Platforma qurilmangizni eslab qoladi, faqat bir marta test yechish imkoningiz mavjud shuning uchun mas'uliyatli bo'lib testni boshlang.</li>
                                </ul>
                            </div>
                            <div>
                                <Input
                                    label="Ism Familyangizni to'liq yozing"
                                    placeholder="Masalan: To'rayev Alisher"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <Button type="submit" variant="primary" fullWidth size="lg" style={{ marginTop: '1.5rem' }} disabled={isStarting || !name.trim()}>
                                <Clock size={18} style={{ marginRight: '0.5rem' }} />
                                {isStarting ? 'Tekshirilmoqda...' : 'Qoidalarga roziman, Boshlash'}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default DirectTakeTest;
