import React, { useState } from 'react';
import { Button } from './Button';
import { Card, CardHeader, CardContent } from './Card';
import { Input } from './Input';
import { Sparkles, X, Loader2 } from 'lucide-react';

export const AiGeneratorModal = ({ isOpen, onClose, onGenerated }) => {
    const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
    const [rawText, setRawText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleGenerate = async () => {
        const activeKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
        if (!activeKey) {
            setError("Iltimos, Google Gemini API kalitini kiritng!");
            return;
        }
        if (!rawText.trim() || rawText.length < 50) {
            setError("Matn juda qisqa. Sifatli test chiqishi uchun to'liqroq matn kiriting.");
            return;
        }

        setError('');
        setLoading(true);

        const prompt = `
      Sen professional dastursan. Senga testlar to'plami beriladi. Odatda oldin barcha test savollari va ularning (A, B, C, D) variantlari yozilgan bo'ladi, matnning eng oxirida esa kalitlar (javoblar ro'yxati, masalan: "1-B, 2-A" yoki "1. B \\n 2. D") beriladi.
      Sening vazifang - shu matn va oxiridagi javoblar kalitini birlashtirib o'qish, testlarni to'liq ajratib olish va ularni faqatgina quyidagi JSON formatida qaytarishdir.
      
      Qoida: Hech qanday qo'shimcha izoh yozma, faqat JSON qaytar.
      Diqqat: "correctOption" bu javoblar kaliti asosida to'g'ri variantning indexi (A=0, B=1, C=2, D=3). Ya'ni agar kalitda ushbu savolning javobi B bo'lsa, correctOption ni 1 qilib belgilaysan.
      Agar umuman kalit berilmagan bo'lsa, o'zing matnga qarab mantiqan eng to'g'ri deb bilgan javobni belgilab qo'y.
      
      Kutilayotgan JSON format:
      [
        {
          "text": "Savol matni",
          "options": ["A varianti", "B varianti", "C varianti", "D varianti"],
          "correctOption": 1 
        }
      ]
      
      Matn: ${rawText}
    `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.2, // Low temp for structured output
                    }
                })
            });

            if (!response.ok) {
                throw new Error("API kaliti noto'g'ri yoki xato yuz berdi.");
            }

            const data = await response.json();
            const rawOutput = data.candidates[0].content.parts[0].text;

            // Try to extract JSON from markdown if Gemini surrounds it with ```json
            let jsonString = rawOutput;
            const jsonMatch = rawOutput.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                jsonString = jsonMatch[1];
            }

            const parsedQuestions = JSON.parse(jsonString);

            // Ensure all questions have unique IDs before returning
            const formattedQs = parsedQuestions.map((q, idx) => ({
                ...q,
                id: Date.now() + idx
            }));

            onGenerated(formattedQs);
            setRawText('');
            onClose();

        } catch (err) {
            console.error(err);
            setError("Test tuzishda xatolik: " + err.message);
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
                            <Sparkles size={20} /> AI yordamida Testlarni Formatlash
                        </div>
                    }
                    action={<Button variant="ghost" onClick={onClose}><X size={20} /></Button>}
                />
                <CardContent>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                            Word yoki Telegramdan olingan chalkash testlarni shu yerga tashlang. Google Gemini ularni o'qib, o'zi platformaga moslab joylashtirib beradi.
                        </p>
                        {!import.meta.env.VITE_GEMINI_API_KEY && (
                            <Input
                                type="password"
                                label="Gemini API Key"
                                placeholder="AIzaSy..."
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                            />
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <label className="input-label">Aralash test matnini kiriting</label>
                        <textarea
                            className="input-field"
                            rows={8}
                            placeholder="1. O'zbekistonning poytaxti qayer?
A) Samarqand B) Toshkent C) Buxoro D) Xiva

2. Mustaqillik qachon e'lon qilingan?
A) 1991 B) 1989 C) 1990 D) 1992

... (va matn oxirida kalitlar) ...
Javoblar:
1-B
2-A"
                            value={rawText}
                            onChange={e => setRawText(e.target.value)}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    {error && <div style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(255,118,117,0.1)', borderRadius: 'var(--radius-sm)' }}>
                        {error}
                    </div>}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <Button variant="ghost" onClick={onClose}>Bekor qilish</Button>
                        <Button variant="primary" onClick={handleGenerate} disabled={loading} style={{ minWidth: '150px' }}>
                            {loading ? (
                                <> <Loader2 size={18} className="spin" style={{ marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} /> Tahlil qilinmoqda... </>
                            ) : (
                                <> <Sparkles size={18} style={{ marginRight: '0.5rem' }} /> Testlarni ajratish </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};
