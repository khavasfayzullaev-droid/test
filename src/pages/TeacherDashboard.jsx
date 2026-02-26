import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTests } from '../context/TestContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { PlusCircle, Copy, Trash2, Users, Edit3, Clock, LogOut, Send, Folder, FolderPlus, ArrowLeft, Edit2, FileText } from 'lucide-react';
import { TelegramBotModal } from '../components/ui/TelegramBotModal';

const TeacherDashboard = () => {
    const { tests, folders, addFolder, deleteFolder, renameFolder, deleteTest, loading } = useTests();
    const navigate = useNavigate();

    const [telegramModalOpen, setTelegramModalOpen] = useState(false);
    const [selectedTestForTelegram, setSelectedTestForTelegram] = useState(null);
    const [currentFolder, setCurrentFolder] = useState(null);

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
        setSelectedTestForTelegram(test);
        setTelegramModalOpen(true);
    };

    const handleCreateFolder = async () => {
        const name = prompt("Yangi papka nomini kiriting:\n(Masalan: 7-sinf Fizika)");
        if (!name || !name.trim()) return;
        const res = await addFolder(name.trim());
        if (res.error) {
            alert("Xatolik: Bunday nomli papka allaqachon mavjud bo'lishi mumkin.");
        }
    };

    const handleRenameFolder = async (e, folder) => {
        e.stopPropagation();
        if (folder.id === 'default-umumiy') {
            alert("Umumiy papkani o'zgartirib bo'lmaydi.");
            return;
        }
        const newName = prompt(`"${folder.name}" papkasining yangi nomini kiriting:`, folder.name);
        if (!newName || !newName.trim() || newName.trim() === folder.name) return;

        const res = await renameFolder(folder.id, folder.name, newName.trim());
        if (res.error) {
            alert("Xato: Papka nomini o'zgartirib bo'lmadi. Boshqa nom tanlang.");
        }
    };

    const handleDeleteFolder = async (e, folder) => {
        e.stopPropagation();
        if (window.confirm(`"${folder.name}" papkasini o'chirmoqchimisiz? Ichidagi testlar "Umumiy" papkasiga ko'chiriladi.`)) {
            await deleteFolder(folder.id, folder.name);
        }
    };

    // A helper function to determine which folder a test belongs to
    const getFolderForTest = (test) => {
        const cat = test.category || 'Umumiy';
        // If the category matches a created folder name, it belongs there
        if (folders && folders.some(f => f.name === cat)) return cat;
        // Otherwise, it falls back to 'Umumiy'
        return 'Umumiy';
    };

    // Combine custom folders with the default 'Umumiy' folder
    const allFolders = [{ id: 'default-umumiy', name: 'Umumiy' }, ...(folders || [])];

    const handlePDFExport = (folderName) => {
        const folderTests = tests.filter(t => getFolderForTest(t) === folderName);
        if (folderTests.length === 0) {
            alert("Bu papkada testlar yo'q");
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Iltimos, qalqib chiquvchi oynalarga (pop-up) ruxsat bering!");
            return;
        }

        let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${folderName} - Testlar to'plami</title>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 2rem 4rem; color: #1e293b; line-height: 1.6; max-width: 900px; margin: 0 auto; }
                    h1 { text-align: center; color: #0f172a; border-bottom: 3px solid #3b82f6; padding-bottom: 1rem; margin-bottom: 2rem; font-size: 2.2rem; }
                    .test-block { margin-bottom: 3rem; page-break-inside: avoid; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 2rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                    .test-title { font-size: 1.6rem; color: #2563eb; margin-bottom: 1.5rem; border-bottom: 1px dashed #cbd5e1; padding-bottom: 0.5rem; font-weight: 600; }
                    .question-block { margin-bottom: 1.5rem; }
                    .question-text { font-weight: 600; margin-bottom: 0.75rem; font-size: 1.15rem; color: #334155; }
                    .options-list { list-style-type: upper-alpha; margin-left: 2rem; }
                    .option-item { margin-bottom: 0.4rem; font-size: 1.05rem; }
                    @media print {
                        .no-print { display: none !important; }
                        body { padding: 0; max-width: 100%; box-shadow: none; }
                        .test-block { border: none; box-shadow: none; padding: 0; border-bottom: 2px solid #ccc; border-radius: 0; margin-bottom: 2rem; padding-bottom: 2rem; }
                        h1 { border-bottom: 2px solid #000; color: #000; }
                        .test-title { color: #000; border-bottom: 1px solid #ddd; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print" style="text-align:center; margin-bottom:30px; position: sticky; top: 0; background: white; padding: 10px; border-bottom: 1px solid #eee;">
                    <button onclick="window.print()" style="padding:12px 24px; font-size:16px; font-weight: bold; background:#3b82f6; color:white; border:none; cursor:pointer; border-radius:6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        🖨️ PDF qilib saqlash (Print)
                    </button>
                    <p style="font-size: 0.85rem; color: #64748b; margin-top: 8px;">* Chrome brauzerida "Save as PDF" rejimini tanlang</p>
                </div>
                <h1>📁 ${folderName}</h1>
        `;

        folderTests.forEach((test, testIndex) => {
            htmlContent += `
                <div class="test-block">
                    <div class="test-title">Test ${testIndex + 1}: ${test.title}</div>
            `;

            if (test.questions && Array.isArray(test.questions)) {
                test.questions.forEach((q, qIndex) => {
                    htmlContent += `
                        <div class="question-block">
                            <div class="question-text">${qIndex + 1}. ${q.text}</div>
                    `;
                    if (q.image) {
                        htmlContent += `<img src="${q.image}" style="max-width:300px; max-height:300px; display:block; padding:10px 0; border-radius: 4px;"/>`;
                    }

                    htmlContent += `<ol class="options-list">`;
                    q.options.forEach(opt => {
                        htmlContent += `<li class="option-item">${opt}</li>`;
                    });
                    htmlContent += `</ol></div>`;
                });
            }
            htmlContent += `</div>`;
        });

        htmlContent += `
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {currentFolder ? (
                            <>
                                <Button variant="ghost" onClick={() => setCurrentFolder(null)} style={{ padding: '0.5rem', marginRight: '0.5rem' }}>
                                    <ArrowLeft size={24} />
                                </Button>
                                📁 {currentFolder}
                            </>
                        ) : (
                            "Mening Papkalarim"
                        )}
                    </h2>
                    <p className="text-muted">
                        {currentFolder
                            ? "Ushbu papkadagi barcha testlar ro'yxati."
                            : "Testlaringizni papkalar orqali tartibli saqlang va boshqaring."}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {!currentFolder && (
                        <Button variant="outline" size="lg" onClick={handleLogout} style={{ color: 'var(--danger)', borderColor: 'rgba(231, 76, 60, 0.3)' }}>
                            <LogOut size={18} style={{ marginRight: '0.5rem' }} /> Profildan chiqish
                        </Button>
                    )}

                    {!currentFolder ? (
                        <Button variant="primary" size="lg" onClick={handleCreateFolder}>
                            <FolderPlus size={18} style={{ marginRight: '0.5rem' }} /> Yangi Papka
                        </Button>
                    ) : (
                        <>
                            <Button variant="outline" size="lg" onClick={() => handlePDFExport(currentFolder)} style={{ color: 'var(--primary)', borderColor: 'var(--primary)', background: 'var(--bg-glass)' }}>
                                <FileText size={18} style={{ marginRight: '0.5rem' }} /> PDF Yuklab olish
                            </Button>
                            <Button variant="primary" size="lg" onClick={() => navigate('/teacher/create', { state: { defaultCategory: currentFolder } })}>
                                <PlusCircle size={18} style={{ marginRight: '0.5rem' }} /> Test tayyorlash
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {!currentFolder ? (
                // --- FOLDERS VIEW ---
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {allFolders.map(folder => {
                        const testCount = tests.filter(t => getFolderForTest(t) === folder.name).length;
                        return (
                            <Card
                                key={folder.id}
                                glass
                                style={{ cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
                                onClick={() => setCurrentFolder(folder.name)}
                            >
                                <CardContent style={{ padding: '2rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                    <Folder size={48} color="var(--primary)" style={{ opacity: 0.8 }} />
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{folder.name}</h3>
                                    <div style={{ background: 'rgba(52, 152, 219, 0.1)', color: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 500 }}>
                                        {testCount} ta test
                                    </div>
                                </CardContent>
                                {folder.id !== 'default-umumiy' ? (
                                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.25rem' }}>
                                        <Button variant="ghost" size="sm" style={{ color: 'var(--text-muted)', padding: '0.4rem', background: 'var(--bg-main)' }} onClick={(e) => handleRenameFolder(e, folder)}>
                                            <Edit2 size={16} />
                                        </Button>
                                        <Button variant="ghost" size="sm" style={{ color: 'var(--danger)', padding: '0.4rem', background: 'var(--bg-main)' }} onClick={(e) => handleDeleteFolder(e, folder)}>
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                ) : (
                                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-main)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontWeight: 500 }}>Asosiy Papka</span>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            ) : (
                // --- TESTS IN FOLDER VIEW ---
                <>
                    {tests.filter(t => getFolderForTest(t) === currentFolder).length === 0 ? (
                        <Card style={{ textAlign: 'center', padding: '4rem 1rem' }} glass>
                            <CardContent>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Bu papka bo'sh</h3>
                                <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Ushbu papkaga yangi test tayyorlang.</p>
                                <Button variant="primary" onClick={() => navigate('/teacher/create', { state: { defaultCategory: currentFolder } })}>
                                    Birinchi testni tayyorlash
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                            {tests.filter(t => getFolderForTest(t) === currentFolder).map(test => (
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
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>TEST HAVOLASI:</span>
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
                    )}
                </>
            )}

            <TelegramBotModal
                isOpen={telegramModalOpen}
                onClose={() => setTelegramModalOpen(false)}
                test={selectedTestForTelegram}
            />
        </div>
    );
};

export default TeacherDashboard;
