const SUPABASE_URL = "https://rbqnyceezhspkhrdbszq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicW55Y2VlemhzcGtocmRic3pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MjQ0NTMsImV4cCI6MjA4NzUwMDQ1M30.leFMTqJk1o8gL4YDzrNz9tLElpjcffNw8z14TV33--s";

const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
};

async function check() {
    let res = await fetch(`${SUPABASE_URL}/rest/v1/submissions?select=*&limit=1`, { headers });
    let data = await res.json();
    console.log("Submissions Query Result:", data);

    // Attempt an insert to see the exact error
    let resInsert = await fetch(`${SUPABASE_URL}/rest/v1/submissions`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({
            testId: "TEST1",
            studentName: "TestStudent",
            deviceId: "123",
            answers: {},
            score: 0,
            totalQuestions: 1,
            submittedAt: new Date().toISOString()
        })
    });

    if (!resInsert.ok) {
        console.error("Insert Error Response:", await resInsert.text());
    } else {
        console.log("Insert Success:", await resInsert.json());
    }
}

check();
