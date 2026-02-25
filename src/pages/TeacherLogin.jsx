import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Brain, Lock } from 'lucide-react';

const TeacherLogin = () => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();

        // Hardcoded credentials for MVP
        if (login === 'AbdulmatinSirojov' && password === 'Zdrfv62924') {
            localStorage.setItem('isTeacherLoggedIn', 'true');
            navigate('/teacher');
        } else {
            setError('Login yoki parol noto\'g\'ri!');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }} className="fade-in">
            <Card style={{ maxWidth: '400px', width: '100%', borderTop: '4px solid var(--primary)' }}>
                <CardHeader
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1.5rem' }}>
                            <Lock size={24} color="var(--primary)" />
                            Admin Panel
                        </div>
                    }
                />
                <CardContent style={{ paddingTop: '1.5rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <Brain size={48} color="var(--primary)" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
                        <p className="text-muted">Testlarni boshqarish uchun tizimga kiring</p>
                    </div>

                    {error && (
                        <div style={{ padding: '0.75rem', background: 'rgba(255, 118, 117, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem', border: '1px solid var(--danger)' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <Input
                            label="Login"
                            placeholder="Loginni kiriting"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            autoComplete="off"
                            required
                        />
                        <Input
                            label="Parol"
                            type="password"
                            placeholder="Parolni kiriting"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                        />
                        <Button variant="primary" type="submit" size="lg" style={{ marginTop: '0.5rem' }}>
                            Tizimga kirish
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default TeacherLogin;
