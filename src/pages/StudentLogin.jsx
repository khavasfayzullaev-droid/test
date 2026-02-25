import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTests } from '../context/TestContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { ArrowLeft, UserCheck } from 'lucide-react';

const StudentLogin = () => {
    const [testCode, setTestCode] = useState('');
    const [studentName, setStudentName] = useState('');
    const [error, setError] = useState('');

    const { tests, hasStudentTaken } = useTests();
    const navigate = useNavigate();

    const handleJoin = async (e) => {
        e.preventDefault();
        setError('');

        if (!testCode.trim() || !studentName.trim()) {
            setError("Iltimos, ismingiz va test kodini kiriting!");
            return;
        }

        const codeUpper = testCode.trim().toUpperCase();
        const testExists = tests.find(t => t.id.toUpperCase() === codeUpper);

        if (!testExists) {
            setError("Bunday test topilmadi. Kodni tekshirib qayta urinib ko'ring.");
            return;
        }

        if (localStorage.getItem(`completed_test_${testExists.id}`)) {
            setError("Siz bu testni ushbu qurilmadan allaqachon ishlab bo'lgansiz.");
            return;
        }

        // Check if this student already took the test
        const taken = await hasStudentTaken(testExists.id, studentName.trim());
        if (taken) {
            setError("Ushbu ism bilan test allaqachon topshirilgan! Iltimos, familiyangizni ham qo'shib yozing (Masalan: Ali Valiyev).");
            return;
        }

        // Save student details briefly to persist during test
        sessionStorage.setItem('currentStudentName', studentName.trim());

        // Navigate to actual test
        navigate(`/student/test/${codeUpper}`);
    };

    return (
        <div className="fade-in auth-container" style={{ background: 'transparent', minHeight: '60vh' }}>
            <Card glass style={{ maxWidth: '450px', width: '100%', margin: '0 auto', borderTop: '4px solid var(--primary)' }}>
                <CardHeader
                    title="Testga Kirish"
                    subtitle="Ustozingiz bergan kod va ismingizni kiriting"
                    action={<Button variant="ghost" onClick={() => navigate('/')}><ArrowLeft size={18} /></Button>}
                />
                <CardContent>
                    <form onSubmit={handleJoin}>
                        <Input
                            label="Ismingiz va Familiyangiz"
                            placeholder="Masalan: Alisher Navoiy"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            autoComplete="name"
                        />

                        <Input
                            label="Test Kodi"
                            placeholder="Masalan: X7A9B"
                            value={testCode}
                            onChange={(e) => setTestCode(e.target.value)}
                            style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}
                            error={error}
                        />
                        <div style={{ background: 'rgba(231, 76, 60, 0.05)', border: '1px solid rgba(231, 76, 60, 0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0', color: 'var(--danger)', fontSize: '0.9rem' }}>
                                <AlertTriangle size={16} /> Qat'iy Qoidalar:
                            </h4>
                            <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <li>Testni faqat <strong>1 marta</strong> ishlash mumkin.</li>
                                <li>Test vaqtida <strong>boshqa sahifaga o'tsangiz</strong>, test avtomatik yopiladi va 0 ball qo'yiladi.</li>
                                <li>Hech qaysi ism ostida qayta kira olmaysiz.</li>
                            </ul>
                        </div>

                        <Button type="submit" variant="primary" fullWidth size="lg" style={{ marginTop: '1.5rem' }}>
                            <UserCheck size={18} style={{ marginRight: '0.5rem' }} /> Qoidalarga roziman, Boshlash
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default StudentLogin;
