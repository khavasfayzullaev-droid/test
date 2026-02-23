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

    const { tests } = useTests();
    const navigate = useNavigate();

    const handleJoin = (e) => {
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

                        <Button type="submit" variant="primary" fullWidth size="lg" style={{ marginTop: '1rem' }}>
                            <UserCheck size={18} style={{ marginRight: '0.5rem' }} /> Testni Boshlash
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default StudentLogin;
