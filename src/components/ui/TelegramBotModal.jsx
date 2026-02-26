import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { X, Send, AlertCircle, CheckCircle } from 'lucide-react';

export const TelegramBotModal = ({ isOpen, onClose, test }) => {
    const [token, setToken] = useState('');
    const [chatId, setChatId] = useState('');
    const [status, setStatus] = useState('idle'); // idle, sending, success, error
    const [progress, setProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            setToken(localStorage.getItem('telegram_bot_token') || '');
            setChatId(localStorage.getItem('telegram_chat_id') || '');
            setStatus('idle');
            setProgress(0);
            setErrorMessage('');
        }
    }, [isOpen]);

    if (!isOpen || !test) return null;

    const handleSend = async () => {
        if (!token.trim() || !chatId.trim()) {
            setErrorMessage("Iltimos, Bot Token va Kanal manzilini kiriting.");
            return;
        }

        // Save for future use
        localStorage.setItem('telegram_bot_token', token.trim());
        localStorage.setItem('telegram_chat_id', chatId.trim());

        setStatus('sending');
        setErrorMessage('');
        setProgress(0);

        try {
            // Optional: First send a message with the exam title and link
            let introText = `📝 <b>TEST: ${test.title}</b>\n\n`;
            introText += `👇 Paski qismda anonim test (Viktorina) ishlang. Reytingli ishlash uchun esa quyidagi ssilkaga o'ting:\n🔗 ${window.location.origin}/take/${test.id.toUpperCase()}`;

            await fetch('/api/telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint: 'sendMessage',
                    token: token.trim(),
                    chat_id: chatId.trim(),
                    text: introText,
                    parse_mode: 'HTML'
                })
            });

            // Send each question as a Poll -> Quiz
            for (let i = 0; i < test.questions.length; i++) {
                const q = test.questions[i];

                // Telegram max 10 options
                const validOptions = q.options.slice(0, 10);

                const payload = {
                    endpoint: 'sendPoll',
                    token: token.trim(),
                    chat_id: chatId.trim(),
                    question: `[${i + 1}/${test.questions.length}] ${q.text.substring(0, 290)}`,
                    options: validOptions.map(opt => String(opt).substring(0, 100)), // Telegram limit 100 chars
                    is_anonymous: true,
                    type: "quiz",
                    correct_option_id: q.correctOption,
                };

                const res = await fetch('/api/telegram', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();

                if (!data.ok) {
                    throw new Error(data.description || "Telegram API xatoligi yuz berdi");
                }

                setProgress(Math.round(((i + 1) / test.questions.length) * 100));

                // Delay to prevent hitting Telegram API limits (approx 1 sec per message is safe)
                await new Promise(r => setTimeout(r, 1000));
            }

            setStatus('success');
        } catch (error) {
            console.error("Telegram send error:", error);
            setStatus('error');
            setErrorMessage(error.message || "Ulanishda xatolik yuz berdi. Token yoki kanal nomini tekshiring.");
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem'
        }}>
            <div className="fade-in" style={{
                background: 'var(--bg-main)', width: '100%', maxWidth: '500px',
                borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden', display: 'flex', flexDirection: 'column'
            }}>
                <div style={{
                    padding: '1.5rem', borderBottom: '1px solid var(--border-light)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Send size={20} color="var(--primary)" /> Telegramga Haqiqiy Viktorina
                        </h3>
                    </div>
                    <button onClick={onClose} disabled={status === 'sending'} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: '0.25rem'
                    }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
                    {status === 'success' ? (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                            <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
                            <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--success)' }}>Muvaffaqiyatli yuborildi!</h4>
                            <p className="text-muted">Testlaringiz bot orqali kanalga joylandi.</p>
                            <Button variant="primary" onClick={onClose} style={{ marginTop: '1.5rem' }}>Yopish</Button>
                        </div>
                    ) : (
                        <>
                            <div style={{ background: 'rgba(52, 152, 219, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', gap: '0.75rem' }}>
                                <AlertCircle size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    Tasvir bo'yicha haqiqiy viktorinalar chiqarish uchun bot kerak. BotFather orqali yangi bot oching. Unig <b>Tokenini</b> shu yerga yozing va botni o'z kanalingizga admin qiling.
                                </div>
                            </div>

                            <Input
                                label="Bot Tokeni (BotFather olingan)"
                                placeholder="Masalan: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                disabled={status === 'sending'}
                            />

                            <Input
                                label="Kanal yoki Guruh manzili / ID si"
                                placeholder="Masalan: @mening_kanalim"
                                value={chatId}
                                onChange={(e) => setChatId(e.target.value)}
                                disabled={status === 'sending'}
                            />

                            {errorMessage && (
                                <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
                                    Xatolik: {errorMessage}
                                </div>
                            )}

                            {status === 'sending' && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                        <span>Yuborilmoqda...</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', background: 'var(--primary)', width: `${progress}%`, transition: 'width 0.3s' }}></div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {status !== 'success' && (
                    <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <Button variant="outline" onClick={onClose} disabled={status === 'sending'}>
                            Bekor qilish
                        </Button>
                        <Button variant="primary" onClick={handleSend} disabled={status === 'sending' || !token || !chatId}>
                            {status === 'sending' ? 'Yuborilmoqda...' : 'Yuborish'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
