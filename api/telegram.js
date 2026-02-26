export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { endpoint, token, ...bodyPayload } = req.body;

        if (!endpoint || !token) {
            return res.status(400).json({ error: 'Missing endpoint or token' });
        }

        const url = `https://api.telegram.org/bot${token}/${endpoint}`;

        const telegramRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload)
        });

        const data = await telegramRes.json();

        return res.status(telegramRes.status).json(data);
    } catch (error) {
        console.error('Telegram Proxy Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
