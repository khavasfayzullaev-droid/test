import React, { useState } from 'react';
import { Button } from './Button';
import { Card, CardHeader, CardContent } from './Card';
import { Input } from './Input';
import { Sparkles, X, Loader2 } from 'lucide-react';

export const AiGeneratorModal = ({ isOpen, onClose, onGenerated }) => {
    // Attempt to load API key from environment, fallback to manual input if missing
    const envApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    const [apiKey, setApiKey] = useState(envApiKey);
    const [rawText, setRawText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!apiKey.trim()) {
            setError("Iltimos, Google Gemini API kalitini kiritng!");
            return;
        }
        if (!rawText.trim() || rawText.length < 20) {
            setError("Matn juda qisqa. Sifatli test chiqishi uchun to'liqroq matn kiriting.");
            return;
        }

        setError('');
        setLoading(true);

        const prompt = `
O'qituvchi senga test matnini kiritdi. Matnda test savollari, A,B,C,D variantlari va oxirida tushunarsiz javoblar kaliti qatnashgan. Muhimi matn Arab (yoki boshqa RTL) tilida g'alati formatda ham bo'lishi mumkin.
Sening yagona vazifang ushbu matndan testlarni toza holda bittalab ajratib olish va ularni qat'iy JSON formatida qaytarishdir. 
Hech qanday qo'shimcha gap yozma, mutlaqo faqat JSON Array qaytar ([ bilan boshlanib, ] bilan tugasin).

QIP-QIZIL QOIDALAR:
1. "correctOption" tahlili: Agar foydalanuvchi javoblar kalitini (masalan: 1-A, 2-B, yoki "1. A") matnning eng tagida bergan bo'lsa, ushbu kalit asosida "correctOption" ga to'g'ri indeksni yoz. Indeks qat'iy raqam (0, 1, 2, 3) bo'lishi shart (Masalan: A=0, B=1, C=2, D=3). Agar umuman javob topa olmasang, 0 yoz.
2. Variantlarni uzish: Savolning matni ("text") ga ASLO variantlarni qo'shib yuborma! Arab yoki aralash tilli matnlarda variantlar (A, B, C, D harflari) bitta qatorda yozilib ketgan bo'lsa ham, ularni savoldan "shafqatsizlarcha" kesib ajratib ol va faqat "options" massivi ichiga mustaqil matn sifatida sol.
3. 4 ta Array: "options" massivi doimo roppa-rosa 4 ta elementdan iborat bo'lishi shart. Javob matnidan A), B), C), D) kabi bosh harflarni olib tashlab, faqat sof javobning o'zini yoz.
4. Javoblar blokini filtrlash: Matnning eng oxirida keladigan "Javoblar: 1-A..." kabi kalit izohlar aslo oxirgi savolning matniga ulanib qolmasin. Kalit qismini savol deb o'ylab xato qilib tizimga kiritma. U butunlay inkor qilinishi (ignore) kerak.

Kutilayotgan qat'iy JSON strukturasi (Boshqacha bo'lmasin):
[
  {
    "text": "O'zbekistonning poytaxti qayer?",
    "options": ["Toshkent", "Samarqand", "Buxoro", "Xiva"],
    "correctOption": 0 
  }
]

Mana Foydalanuvchi kiritgan va tahlil qilishing kerak bo'lgan matn:
=======================
${rawText}
=======================
`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.1, // very low temperature for highly structured output
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error("API xatosi: " + (errData.error?.message || response.statusText));
            }

            const data = await response.json();
            const rawOutput = data.candidates[0].content.parts[0].text;

            // Extract JSON blocks using regex
            let jsonString = rawOutput;
            const jsonMatch = rawOutput.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                jsonString = jsonMatch[0];
            } else {
                throw new Error("Sun'iy intellekt tushunarsiz format qaytardi.");
            }

            const parsedQuestions = JSON.parse(jsonString);

            if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
                throw new Error("Testlar topilmadi.");
            }

            // Ensure robustness of the object before sending to main app
            const formattedQs = parsedQuestions.map((q, idx) => ({
                id: Date.now() + idx,
                text: q.text || "Savol yozilmagan?",
                options: q.options && Array.isArray(q.options) && q.options.length === 4 ? q.options : ["A variant", "B variant", "C variant", "D variant"],
                correctOption: typeof q.correctOption === 'number' && q.correctOption >= 0 && q.correctOption <= 3 ? q.correctOption : 0
            }));

            onGenerated(formattedQs);
            setRawText('');
            onClose();

        } catch (err) {
            console.error(err);
            setError("Test tuzishda xatolik yuz berdi: Matnda mantiqiy xatolar mavjud yoki to'g'ri kelmas format.");
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
                            <Sparkles size={20} /> AI Qudrati Bilant Test Yasash
                        </div>
                    }
                    action={<Button variant="ghost" onClick={onClose} disabled={loading}><X size={20} /></Button>}
                />
                <CardContent>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                            Telegram yoki Word-dan olingan tartibsiz testlarni shu yerga qo'ying. Sun'iy Intellekt ularni avtomatik tarzda chuqur o'qib-tahlil qilib, o'zi platformaga ko'rinishida (4 ta variant va to'g'ri kalitini topgan holda) mukammal joylashtirib beradi.
                        </p>
                    </div>

                    {!envApiKey && (
                        <div style={{ marginBottom: '1rem' }}>
                            <Input
                                type="password"
                                label="Gemini API Kaliti (Key)"
                                placeholder="AIzaSy..."
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <label className="input-label">Aralash tartibsiz matn:</label>
                        <textarea
                            className="input-field"
                            rows={10}
                            placeholder="Namuna sifatida kiriting:
1. O'zbekistonning poytaxti qayer?
A) Samarqand
B) Toshkent
C) Buxoro
D) Xiva

2. Mustaqillik qachon e'lon qilingan?
A) 1991 B) 1989 C) 1990 D) 1992

Javoblar: 1-B, 2-A"
                            value={rawText}
                            onChange={e => setRawText(e.target.value)}
                            style={{ resize: 'vertical' }}
                            disabled={loading}
                        />
                    </div>

                    {error && <div style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(255,118,117,0.1)', borderRadius: 'var(--radius-sm)' }}>
                        ⚠️ {error}
                    </div>}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <Button variant="ghost" onClick={onClose} disabled={loading} type="button">Bekor qilish</Button>
                        <Button variant="primary" onClick={handleGenerate} disabled={loading} style={{ minWidth: '150px' }} type="button">
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}> <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Tahlil qilinmoqda... </span>
                            ) : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}> <Sparkles size={18} /> Testlarni ajratish </span>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <style dangerouslySetInnerHTML={{ __html: "@keyframes spin { 100% { transform: rotate(360deg); } }" }} />
        </div>
    );
};
