import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    const newTest = {
        id: Math.random().toString(36).substring(2, 9).toUpperCase(),
        title: 'Test Title',
        description: 'Test Desc',
        category: 'Umumiy',
        questions: [],
        timeLimit: 10,
        created_at: new Date().toISOString()
    };

    console.log("Attempting to insert test...", newTest.id);
    const { data, error } = await supabase.from('tests').insert([newTest]);
    if (error) {
        console.error("Supabase Error:", error);
    } else {
        console.log("Success:", data);
    }
}

testInsert();
