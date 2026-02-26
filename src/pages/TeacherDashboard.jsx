import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTests } from '../context/TestContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { PlusCircle, Copy, Trash2, Users, Edit3, Clock, LogOut, Send } from 'lucide-react';

const TeacherDashboard = () => {
    const { tests, deleteTest, loading } = useTests();
    const navigate = useNavigate();

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '4rem' }}>Ma'lumotlar yuklanmoqda...</div>;
    }

    const handleCopyCode = (id) => {
        navigator.clipboard.writeText(`${window.location.origin}/take/${id}`);
        alert('Test ssilkasi nusxalandi! O\'quvchilarga yuborishingiz mumkin.');
    };

    const handleLogout = () => {
        localStorage.removeItem('isTeacherLoggedIn');
        navigate('/');
    };

    const handleTelegramExport = (test) => {
        let text = `📝 TEST: ${test.title}\n`;
        if (test.category && test.category !== 'Umumiy') text += `📁 Kategoriya: ${test.category}\n`;
        if (test.timeLimit > 0) text += `⏳ Vaqt: ${test.timeLimit} daqiqa\n`;
        text += `🔢 Jami: ${test.questions.length} ta savol\n\n`;
        text += `🖥 Onlayn reytingli ishlash uchun:\n👉 ${window.location.origin}/take/${test.id.toUpperCase()}\n\n`;
        text += `👇 Paski qismda anonim telegram viktorina:\n➖➖➖➖➖➖➖➖➖➖\n\n`;

        test.questions.forEach((q, index) => {
            text += `❓ ${index + 1}-savol: ${q.text}\n`;
            const letters = ['A', 'B', 'C', 'D'];
            q.options.forEach((opt, optIndex) => {
                text += `${letters[optIndex]}) ${opt}\n`;
            });
            const correctOpt = q.options[q.correctOption];
            text += `\n✅ Javob: || ${letters[q.correctOption]}) ${correctOpt} ||\n\n`;
        });

        navigator.clipboard.writeText(text);
        alert('✅ Diqqat! Test Telegram formatida nusxalandi.\n\nSirli spoilerlar ishlashi uchun uni Telegram guruh yoki kanalingizga shunchaki Paste (Tashlash) qilib yuboring. To\'g\'ri javoblar qora chiziq ostida yashirin holatda bo\'ladi, uni ustiga bossangiz ochiladi.');
    };

    // Group tests by category
    const groupedTests = tests.reduce((acc, test) => {
        const cat = test.category || 'Umumiy';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(test);
        return acc;
    }, {});

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        Mening Testlarim
                    </h2>
                    <p className="text-muted">Testlaringizni shu yerda tayyorlab o'zgartirish kiritishingiz mumkin.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <Button variant="outline" size="lg" onClick={handleLogout} style={{ color: 'var(--danger)', borderColor: 'rgba(231, 76, 60, 0.3)' }}>
                        <LogOut size={18} style={{ marginRight: '0.5rem' }} /> Profildan chiqish
                    </Button>
                    <Button variant="primary" size="lg" onClick={() => navigate('/teacher/create')}>
                        <PlusCircle size={18} style={{ marginRight: '0.5rem' }} /> Test tayyorlash
                    </Button>
                </div>
            </div>

            {tests.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: '4rem 1rem' }} glass>
                    <CardContent>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Hali testlar yo'q</h3>
                        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Yangi test yarating va o'quvchilarga yuboring.</p>
                        <Button variant="primary" onClick={() => navigate('/teacher/create')}>
                            Birinchi testni tayyorlash
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    {Object.entries(groupedTests).map(([categoryName, categoryTests]) => (
                        <div key={categoryName}>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                📁 {categoryName}
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal', background: 'var(--bg-glass)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)' }}>
                                    {categoryTests.length} ta
                                </span>
                            </h3>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                {categoryTests.map(test => (
                                    <Card key={test.id} glass>
                                        <CardHeader
                                            title={test.title}
                                            subtitle={`${new Date(test.created_at || test.createdAt || new Date()).toLocaleDateString()} da yaratilgan • ${test.questions?.length || 0} ta savol`}
                                        />
                                        <CardContent>
                                            {test.timeLimit > 0 && (
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', background: 'rgba(253,203,110,0.2)', color: '#856404', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-full)', marginBottom: '0.75rem', fontWeight: 500 }}>
                                                    <Clock size={13} /> {test.timeLimit} daqiqa
                                                </div>
                                            )}
                                            <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                                <div style={{ overflow: 'hidden' }}>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>TEST HAVOLASI (LINK):</span>
                                                    <strong style={{ fontSize: '0.9rem', color: 'var(--primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', display: 'block', overflow: 'hidden' }}>
                                                        {window.location.origin}/take/{test.id.toUpperCase()}
                                                    </strong>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => handleCopyCode(test.id.toLowerCase())}>
                                                    <Copy size={18} />
                                                </Button>
                                            </div>
                                        </CardContent>
                                        <CardFooter style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <Button variant="outline" size="sm" onClick={() => navigate(`/teacher/results/${test.id}`)}>
                                                    <Users size={16} style={{ marginRight: '0.4rem' }} /> Natijalar
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => navigate(`/teacher/edit/${test.id}`)}>
                                                    <Edit3 size={16} style={{ marginRight: '0.4rem' }} /> Tahrirlash
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => handleTelegramExport(test)} style={{ color: 'var(--primary)', borderColor: 'rgba(52, 152, 219, 0.3)' }}>
                                                    <Send size={16} style={{ marginRight: '0.4rem' }} /> Telegram
                                                </Button>
                                            </div>
                                            <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={async () => { if (window.confirm('Testni o\'chirishni xohlaysizmi?')) await deleteTest(test.id); }}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;
