import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
    console.log("Fetching a submission...");
    const { data: subs, error: err1 } = await supabase.from('submissions').select('id').limit(1);
    if (err1) { console.error(err1); return; }
    if (!subs.length) { console.log("No submissions found to test."); return; }
    
    const subId = subs[0].id;
    console.log(`Trying to delete submission ${subId}...`);
    
    const { data: delData, error: err2, count } = await supabase.from('submissions').delete({ count: 'exact' }).eq('id', subId);
    console.log("Delete error:", err2);
    console.log("Delete data:", delData);
    console.log("Deleted count:", count);
}
test();
