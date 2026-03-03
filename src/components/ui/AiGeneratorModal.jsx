import React, { useState } from 'react';
import { Button } from './Button';
import { Card, CardHeader, CardContent } from './Card';
import { Sparkles, X, Loader2 } from 'lucide-react';

export const AiGeneratorModal = ({ isOpen, onClose, onGenerated }) => {
    const [rawText, setRawText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!rawText.trim() || rawText.length < 5) {
            setError("Matn juda qisqa. Kamida 5 belgidan iborat javoblar yoxud test kiriting.");
            return;
        }

        setError('');
        setLoading(true);

        try {
            // Give a tiny delay simulating processing time so UI doesn't freeze jarringly
            await new Promise(resolve => setTimeout(resolve, 600));

            const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);
            const parsedQuestions = [];
            const answerKeys = {};

            // 1. Detect if the ENTIRE text is just an Answer Key (e.g. "1 B", "2 C" or Emojis)
            const isPureAnswerKey = lines.every(line => {
                const cleaned = line.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                return cleaned.length >= 2 && cleaned.length <= 5 && /^\d+[ABCD]$/.test(cleaned);
            });

            if (isPureAnswerKey) {
                lines.forEach((line, idx) => {
                    const cleaned = line.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                    const match = cleaned.match(/^(\d+)([ABCD])$/);
                    let correctIdx = 0;
                    if (match) {
                        const letter = match[2];
                        if (letter === 'B') correctIdx = 1;
                        if (letter === 'C') correctIdx = 2;
                        if (letter === 'D') correctIdx = 3;
                    }
                    parsedQuestions.push({
                        id: Date.now() + idx,
                        text: `${match ? match[1] : idx + 1}-savol (Faqat javob kiritilgan)`,
                        options: ["A variant", "B variant", "C variant", "D variant"],
                        correctOption: correctIdx
                    });
                });
                onGenerated(parsedQuestions);
                setRawText('');
                onClose();
                setLoading(false);
                return;
            }

            // 2. Standard Test Parsing
            let currentQuestion = null;
            let parsingKeys = false;
            let currentOptionIndex = -1;

            const questionRegex = /^(\d+)[.)\-\s]+(.+)/;
            const optionRegex = /^([A-D])[.)\-\s]+(.+)/i;
            const inlineOptionsRegex = /A[.)\-\s]+(.+?)\s+B[.)\-\s]+(.+?)\s+C[.)\-\s]+(.+?)\s+D[.)\-\s]+(.+)/i;
            // Catch answer section headers (Javoblar, kalit, kaliti, مفتاح الإجابة)
            const answerKeyHeaderRegex = /(javoblar|kalit|مفتاح الإجابة)/i;
            const keyLineRegex = /^(\d+)[^A-Za-z0-9]*([A-D])/i;

            lines.forEach((line) => {
                // If we reach an answers header
                if (answerKeyHeaderRegex.test(line)) {
                    parsingKeys = true;
                    return;
                }

                if (parsingKeys) {
                    const cleaned = line.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                    const keyMatch = cleaned.match(/^(\d+)([ABCD])$/);
                    if (keyMatch) {
                        const qNum = parseInt(keyMatch[1]);
                        const letter = keyMatch[2];
                        let correctIdx = 0;
                        if (letter === 'B') correctIdx = 1;
                        if (letter === 'C') correctIdx = 2;
                        if (letter === 'D') correctIdx = 3;
                        answerKeys[qNum] = correctIdx;
                    } else {
                        // Sometimes the line is pure like "1-A, 2-B" inline
                        const multiMatches = line.match(/\d+[^A-Za-z0-9]+[A-D]/gi);
                        if (multiMatches) {
                            multiMatches.forEach(m => {
                                const cl = m.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                                const km = cl.match(/^(\d+)([ABCD])$/);
                                if (km) {
                                    let correctIdx = 0;
                                    if (km[2] === 'B') correctIdx = 1;
                                    if (km[2] === 'C') correctIdx = 2;
                                    if (km[2] === 'D') correctIdx = 3;
                                    answerKeys[parseInt(km[1])] = correctIdx;
                                }
                            });
                        }
                    }
                    return;
                }

                // Check for inline options: A) ... B) ... C) ... D) ...
                const inlineMatch = line.match(inlineOptionsRegex);
                if (inlineMatch && currentQuestion) {
                    currentQuestion.options = [inlineMatch[1].trim(), inlineMatch[2].trim(), inlineMatch[3].trim(), inlineMatch[4].trim()];
                    currentOptionIndex = -1;
                    return;
                }

                // Check for block option: A) ...
                const optMatch = line.match(optionRegex);
                if (optMatch && currentQuestion) {
                    const letter = optMatch[1].toUpperCase();
                    const text = optMatch[2].trim();
                    if (letter === 'A') { currentQuestion.options[0] = text; currentOptionIndex = 0; }
                    if (letter === 'B') { currentQuestion.options[1] = text; currentOptionIndex = 1; }
                    if (letter === 'C') { currentQuestion.options[2] = text; currentOptionIndex = 2; }
                    if (letter === 'D') { currentQuestion.options[3] = text; currentOptionIndex = 3; }
                    return;
                }

                // Check for a new Question: 1. ... 
                const qMatch = line.match(questionRegex);
                if (qMatch) {
                    if (currentQuestion) parsedQuestions.push(currentQuestion);
                    currentQuestion = {
                        qNum: parseInt(qMatch[1]),
                        text: qMatch[2].trim(),
                        options: ["A variant", "B variant", "C variant", "D variant"], // Defaults
                        correctOption: 0
                    };
                    currentOptionIndex = -1;
                    return;
                }

                // If it's a multiline extension
                if (currentQuestion) {
                    if (currentOptionIndex >= 0) {
                        currentQuestion.options[currentOptionIndex] += "\n" + line.trim();
                    } else {
                        currentQuestion.text += "\n" + line.trim();
                    }
                }
            });

            if (currentQuestion) parsedQuestions.push(currentQuestion);

            if (parsedQuestions.length === 0) {
                throw new Error("Matndan savollarni va variantlarni ajratib bo'lmadi. Iltimos standartroq format kiriting (masalan: 1. Savol... A)...).");
            }

            // Map correct answers
            const finalQs = parsedQuestions.map((q, idx) => ({
                id: Date.now() + idx,
                text: q.text,
                options: q.options,
                correctOption: answerKeys[q.qNum] !== undefined ? answerKeys[q.qNum] : 0
            }));

            onGenerated(finalQs);
            setRawText('');
            onClose();

        } catch (err) {
            console.error(err);
            setError(`Texnik Xatolik: ${err.message}`);
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
                            <Sparkles size={20} /> Avtomatik Test Yasash
                        </div>
                    }
                    action={<Button variant="ghost" onClick={onClose} disabled={loading}><X size={20} /></Button>}
                />
                <CardContent>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                            Telegram yoki Word-dan olingan tartibsiz testlarni shu yerga qo'ying. Tizim ularni oflayn va tezkor tarzda o'qib-tahlil qilib, o'zi platformaga ko'rinishida mukammal joylashtirib beradi.
                        </p>
                    </div>

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
