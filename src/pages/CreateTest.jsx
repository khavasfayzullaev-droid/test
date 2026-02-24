import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTests } from '../context/TestContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { PlusCircle, Trash2, ArrowLeft, Save, Sparkles } from 'lucide-react';
import { AiGeneratorModal } from '../components/ui/AiGeneratorModal';

const CreateTest = () => {
    const { addTest, tests, updateTest } = useTests();
    const navigate = useNavigate();
    const { editId } = useParams();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [timeLimit, setTimeLimit] = useState('');
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const isEditing = !!editId;

    // Start with 1 empty question
    const [questions, setQuestions] = useState([
        { id: 1, text: '', options: ['', '', '', ''], correctOption: 0 }
    ]);

    // Load existing test data when editing
    useEffect(() => {
        if (editId) {
            const existing = tests.find(t => t.id === editId);
            if (existing) {
                setTitle(existing.title);
                setDescription(existing.description || '');
                setCategory(existing.category || '');
                setTimeLimit(existing.timeLimit ? String(existing.timeLimit) : '');
                setQuestions(existing.questions);
            } else {
                navigate('/teacher');
            }
        }
    }, [editId, tests, navigate]);

    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            { id: Date.now(), text: '', options: ['', '', '', ''], correctOption: 0 }
        ]);
    };

    const handleAiGenerated = (generatedQs) => {
        // If the current first question is empty, remove it
        const isEmptyFirst = questions.length === 1 && questions[0].text === '' && questions[0].options[0] === '';

        if (isEmptyFirst) {
            setQuestions([...generatedQs]);
        } else {
            setQuestions([...questions, ...generatedQs]);
        }
    };

    const handleRemoveQuestion = (id) => {
        if (questions.length > 1) {
            setQuestions(questions.filter(q => q.id !== id));
        } else {
            alert("Kamida 1 ta savol bo'lishi shart!");
        }
    };

    const handleQuestionChange = (id, field, value, optionIndex = null) => {
        setQuestions(questions.map(q => {
            if (q.id === id) {
                if (field === 'text') return { ...q, text: value };
                if (field === 'correctOption') return { ...q, correctOption: value };
                if (field === 'options') {
                    const newOptions = [...q.options];
                    newOptions[optionIndex] = value;
                    return { ...q, options: newOptions };
                }
            }
            return q;
        }));
    };

    const handleSave = async () => {
        // Basic validation
        if (!title.trim()) {
            alert("Test nomini kiriting!"); return;
        }
        const invalidQuestions = questions.filter(q => !q.text.trim() || q.options.some(opt => !opt.trim()));
        if (invalidQuestions.length > 0) {
            alert("Barcha savollar va variantlarni to'ldiring!"); return;
        }

        const payload = { title, description, category: category || 'Umumiy', timeLimit: timeLimit ? parseInt(timeLimit) : 0, questions };

        try {
            if (isEditing) {
                await updateTest(editId, payload);
                alert('Test muvaffaqiyatli yangilandi!');
            } else {
                const testId = await addTest(payload);
                alert(`Test yaratildi! Test kodi: ${testId.toUpperCase()}`);
            }
            navigate('/teacher');
        } catch (err) {
            alert("Testni saqlashda xatolik yuz berdi. Iltimos qaytadan urunib ko'ring.");
            console.error(err);
        }
    };

    return (
        <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                <Button variant="ghost" onClick={() => navigate('/teacher')} style={{ marginRight: '1rem', padding: '0.5rem' }}>
                    <ArrowLeft size={24} />
                </Button>
                <div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{isEditing ? 'Testni Tahrirlash' : 'Yangi Test Yaratish'}</h2>
                    <p className="text-muted">{isEditing ? 'O\'zgartirishlarni kiriting va saqlang' : 'Savollarni tuzing va saqlang'}</p>
                </div>
            </div>

            <Card glass style={{ marginBottom: '2rem' }}>
                <CardContent style={{ paddingTop: '1.5rem' }}>
                    <Input
                        label="Test nomi"
                        placeholder="Masalan: Matematika 5-sinf Chorak Testi"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <Input
                        label="Qisqacha ta'rif (ixtiyoriy)"
                        placeholder="Test haqida qisqacha ma'lumot"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <Input
                        label="Test Bo'limi (Kategoriyasi)"
                        placeholder="Masalan: Beginner, 5-sinf, IELTS..."
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    />
                    <Input
                        label="⏱️ Vaqt chegarasi (daqiqada)"
                        placeholder="Masalan: 30 (bo'sh qoldirsangiz — taymer chiqmaydi)"
                        type="number"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(e.target.value)}
                    />
                </CardContent>
            </Card>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.5rem' }}>Savollar ({questions.length})</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="outline" size="sm" onClick={() => setIsAiModalOpen(true)} style={{ background: 'var(--bg-glass)', borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                        <Sparkles size={16} style={{ marginRight: '0.5rem' }} /> AI orqali Tuzish
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleAddQuestion}>
                        <PlusCircle size={16} style={{ marginRight: '0.5rem' }} /> Qo'lda qo'shish
                    </Button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
                {questions.map((q, qIndex) => (
                    <Card key={q.id} style={{ borderLeft: '4px solid var(--primary)' }}>
                        <CardHeader
                            title={`${qIndex + 1}-Savol`}
                            action={
                                <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={() => handleRemoveQuestion(q.id)}>
                                    <Trash2 size={18} />
                                </Button>
                            }
                        />
                        <CardContent>
                            <Input
                                placeholder="Savol matnini kiriting..."
                                value={q.text}
                                onChange={(e) => handleQuestionChange(q.id, 'text', e.target.value)}
                                style={{ marginBottom: '1.5rem', fontWeight: 500 }}
                            />

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                {q.options.map((opt, optIndex) => (
                                    <div key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="radio"
                                            name={`correct-${q.id}`}
                                            checked={q.correctOption === optIndex}
                                            onChange={() => handleQuestionChange(q.id, 'correctOption', optIndex)}
                                            style={{ cursor: 'pointer', width: '20px', height: '20px', accentColor: 'var(--success)' }}
                                            title="To'g'ri javobni belgilash"
                                        />
                                        <Input
                                            placeholder={`${String.fromCharCode(65 + optIndex)} - variant`}
                                            value={opt}
                                            onChange={(e) => handleQuestionChange(q.id, 'options', e.target.value, optIndex)}
                                            fullWidth
                                            className={q.correctOption === optIndex ? "border-success" : ""}
                                            style={{
                                                margin: 0,
                                                borderColor: q.correctOption === optIndex ? 'var(--success)' : 'var(--border-strong)',
                                                backgroundColor: q.correctOption === optIndex ? 'rgba(0,184,148,0.05)' : 'white'
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                                * Yonidagi aylanani belgilash orqali to'g'ri javobni tanlang.
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', position: 'sticky', bottom: '2rem', padding: '1rem', background: 'var(--bg-glass)', backdropFilter: 'blur(10px)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
                <Button variant="ghost" onClick={() => navigate('/teacher')}>Bekor qilish</Button>
                <Button variant="primary" size="lg" onClick={handleSave}>
                    <Save size={20} style={{ marginRight: '0.5rem' }} /> {isEditing ? 'O\'zgarishlarni Saqlash' : 'Testni Saqlash'}
                </Button>
            </div>

            <AiGeneratorModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                onGenerated={handleAiGenerated}
            />
        </div>
    );
};

export default CreateTest;
