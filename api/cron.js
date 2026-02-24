export default async function handler(request, response) {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return response.status(500).json({ error: 'Missing environment variables' });
    }

    try {
        const fetchRes = await fetch(`${SUPABASE_URL}/rest/v1/tests?select=id&limit=1`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!fetchRes.ok) {
            throw new Error(`Supabase returned ${fetchRes.status}`);
        }

        return response.status(200).json({ message: 'Supabase ping successful', time: new Date().toISOString() });
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
}
