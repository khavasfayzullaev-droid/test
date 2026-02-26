import fs from 'fs';

const SUPABASE_URL = "https://rbqnyceezhspkhrdbszq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicW55Y2VlemhzcGtocmRic3pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MjQ0NTMsImV4cCI6MjA4NzUwMDQ1M30.leFMTqJk1o8gL4YDzrNz9tLElpjcffNw8z14TV33--s";

const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
};

async function check() {
    let testId = '816ES0I';
    let res = await fetch(`${SUPABASE_URL}/rest/v1/submissions?testId=eq.${testId}&select=*`, { headers });
    let data = await res.json();
    console.log(`Submissions for ${testId}:`, data);
    
    // Also check lowercase just in case
    let resLower = await fetch(`${SUPABASE_URL}/rest/v1/submissions?testId=eq.816es0i&select=*`, { headers });
    let dataLower = await resLower.json();
    console.log(`Submissions for 816es0i:`, dataLower);
    
    // Get the test itself to see its deletedSubs legacy list
    let resTest = await fetch(`${SUPABASE_URL}/rest/v1/tests?id=eq.${testId}&select=*`, { headers });
    console.log(`Test Info:`, await resTest.json());
}

check();
