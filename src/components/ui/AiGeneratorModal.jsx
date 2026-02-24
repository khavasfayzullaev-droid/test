import React, { useState } from 'react';
import { Button } from './Button';
import { Card, CardHeader, CardContent } from './Card';
import { Input } from './Input';
import { Sparkles, X, Settings2 } from 'lucide-react';

export const AiGeneratorModal = ({ isOpen, onClose, onGenerated }) => {
    const [rawText, setRawText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!rawText.trim() || rawText.length < 20) {
            setError("Matn juda qisqa. Sifatli test chiqishi uchun to'liqroq matn kiriting.");
            return;
        }

        setError('');
        setLoading(true);

        try {
            // Simulate a tiny delay for UX
            await new Promise(r => setTimeout(r, 500));

            const text = rawText;
            const answerMap = {};
            // Allows formats like "1-A", "1: A", "1A", or "1 A"
            const answerRegex = /(?:^|\s)(\d+)\s*[-:=.]?\s*([A-Da-d])(?=$|\s|,|<br>)/gi;
            let match;

            // Extract answers (like "1-A, 2-B" or "1.C" or "1 B")
            while ((match = answerRegex.exec(text)) !== null) {
                answerMap[parseInt(match[1])] = match[2].toUpperCase();
            }

            // Remove purely answer blocks at the bottom to avoid false logic
            // Added Arabic "مفتاح الإجابة" and general English patterns
            const cleanedText = text.replace(/(?:javoblar|kalitlar|javoblar kaliti|مفتاح الإجابة|answers|keys)\s*:?[\s\S]*/i, '');

            // Match questions like "1. Question text..." or "1) Question text..."
            const questionRegex = /(?:^|\n)\s*(\d+)[\.\)]\s+([\s\S]*?)(?=(?:(?:^|\n)\s*\d+[\.\)]\s+)|$)/g;
            const questions = [];

            while ((match = questionRegex.exec(cleanedText)) !== null) {
                let qNum = parseInt(match[1]);
                let block = match[2].trim();

                // Match A), B), C), D) options inside the block
                const optRegex = /(?:^|\s)([A-Da-d])[\.\)]\s*([\s\S]*?)(?=(?:(?:^|\s)[A-Da-d][\.\)]\s*)|$)/g;
                let optMatch;
                let optionsMap = {};
                let questionText = block;
                let hasOptions = false;

                while ((optMatch = optRegex.exec(block)) !== null) {
                    if (!hasOptions) {
                        questionText = block.substring(0, optMatch.index).trim();
                    }
                    hasOptions = true;
                    optionsMap[optMatch[1].toUpperCase()] = optMatch[2].trim();
                }

                // Default options array (fallback)
                let optionsArr = [
                    optionsMap['A'] || 'A varianti',
                    optionsMap['B'] || 'B varianti',
                    optionsMap['C'] || 'C varianti',
                    optionsMap['D'] || 'D varianti',
                ];

                let correctOption = 0; // Default matches A index 0
                if (answerMap[qNum]) {
                    const idx = ['A', 'B', 'C', 'D'].indexOf(answerMap[qNum]);
                    if (idx !== -1) correctOption = idx;
                }

                if (questionText && questionText.length > 2) {
                    questions.push({
                        id: Date.now() + qNum,
                        text: questionText,
                        options: optionsArr,
                        correctOption: correctOption
                    });
                }
            }

            if (questions.length === 0) {
                throw new Error("Matndan topilmadi! Iltimos savollarni aniq raqamlangan holda ('1.', '2.') va variantlarni harf bilan ('A)', 'B)') kiriting.");
            }

            onGenerated(questions);
            setRawText('');
            onClose();

        } catch (err) {
            console.error(err);
            setError(err.message || "Tahlil qilishda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000, padding: '1rem'
        }}>
            <Card style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                <CardHeader
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                            <Settings2 size={20} /> Avtomatik Test Ajratgich
                        </div>
                    }
                    action={<Button variant="ghost" onClick={onClose}><X size={20} /></Button>}
                />
                <CardContent>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                            Aralash matnni kiriting. Dastur avtomatik ravishda savol, variant va kalitlarni onlaynsiz formatlab oladi (AI API talab qilinmaydi va bepul).
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <label className="input-label">Aralash test matnini kiriting</label>
                        <textarea
                            className="input-field"
                            rows={12}
                            placeholder="Namuna: 
1. O'zbekiston poytaxti qayer?
A) Toshkent
B) Samarqand
C) Buxoro
D) Xiva

Javoblar:
1-A
2-C"
                            value={rawText}
                            onChange={e => setRawText(e.target.value)}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ minHeight: error ? 'auto' : '0' }}>
                        {error && (
                            <div style={{
                                color: 'var(--danger)',
                                fontSize: '0.875rem',
                                marginBottom: '1.5rem',
                                padding: '0.75rem',
                                background: 'rgba(255,118,117,0.1)',
                                borderRadius: 'var(--radius-sm)',
                                wordBreak: 'break-word'
                            }}>
                                ⚠️ {String(error)}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <Button variant="ghost" onClick={onClose} type="button">Bekor qilish</Button>
                        <Button variant="primary" onClick={handleGenerate} disabled={loading} style={{ minWidth: '150px' }} type="button">
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Settings2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Tahlil qilinmoqda...
                                </span>
                            ) : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Sparkles size={18} /> Testlarni ajratish
                                </span>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};
