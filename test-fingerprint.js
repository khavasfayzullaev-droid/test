const SUPABASE_URL = "https://rbqnyceezhspkhrdbszq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicW55Y2VlemhzcGtocmRic3pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MjQ0NTMsImV4cCI6MjA4NzUwMDQ1M30.leFMTqJk1o8gL4YDzrNz9tLElpjcffNw8z14TV33--s";

const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
};

async function runTest() {
    console.log("=== BAZA XAVFSIZLIK TESTI: QURILMA BLOKI (FINGERPRINT) ===");

    // 1. Get a test ID to simulate with
    let res = await fetch(`${SUPABASE_URL}/rest/v1/tests?select=id,description&limit=1`, { headers });
    let tests = await res.json();
    if (!tests || !tests.length) {
        console.log("No test found or error:", tests);
        return;
    }
    const test = tests[0];
    const testId = test.id;
    let desc = test.description || '';
    let deletedSubs = [];
    const deletedMatch = desc.match(/:::DELETED_SUBS=(\[.*?\]):::/);
    if (deletedMatch) {
        try { deletedSubs = JSON.parse(deletedMatch[1]); } catch (e) { }
    }
    test.deletedSubs = deletedSubs;

    console.log(`[+] Test topildi: ${testId}`);

    const uniqueDeviceId = 'SIMULATION_HASH_9999';
    const name1 = 'Azizbek (1-urinish)';
    const name2 = 'Umidjon (Ayni shu qurilmadan aylanib kirishga urinish)';

    // Cleanup first
    await fetch(`${SUPABASE_URL}/rest/v1/submissions?deviceId=eq.${uniqueDeviceId}`, { method: 'DELETE', headers });

    console.log(`\n[1] ${name1} testni normal ishlab topshirmoqda (Qurilma ID: ${uniqueDeviceId})...`);
    res = await fetch(`${SUPABASE_URL}/rest/v1/submissions`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({
            testId,
            studentName: name1,
            deviceId: uniqueDeviceId,
            answers: { "1": "a" },
            score: 1,
            totalQuestions: 1,
            submittedAt: new Date().toISOString()
        })
    });
    if (!res.ok) throw new Error(await res.text());
    console.log(`    ✅ Muvaffaqiyatli saqlandi! Baza qabul qildi.`);

    // Simulate `hasStudentTaken` query for name2 on the same device
    console.log(`\n[2] U Endi brauzer tarixini o'chirib yashirin rejimda (Incognito) ${name2} deb ismini yozib kirishga urinmoqda...`);

    // Exact TestContext.jsx query using Supabase OR syntax
    const queryUrl = `${SUPABASE_URL}/rest/v1/submissions?select=id,studentName,deviceId&testId=eq.${testId}&or=(studentName.ilike.*${encodeURIComponent(name2)}*,deviceId.eq.${uniqueDeviceId})`;

    res = await fetch(queryUrl, { headers });
    const results = await res.json();

    const deletedList = test.deletedSubs || [];
    const activeSubmissions = results.filter(sub => !deletedList.includes(sub.id));

    if (activeSubmissions.length > 0) {
        const nameMatch = activeSubmissions.some(s => s.studentName.toLowerCase() === name2.toLowerCase());
        const deviceMatch = uniqueDeviceId && activeSubmissions.some(s => s.deviceId === uniqueDeviceId);

        if (deviceMatch && !nameMatch) {
            console.log(`    🛡️ XAVFSIZLIK ISHLADI: Tizim uni o'tkazmadi! Sabab: "DEVICE" `);
            console.log(`       => Baza tushunib yetdi: Garchi uning ismi boshqa bo'lsa ham, ${uniqueDeviceId} kodli qurilma oldin qatnashgan!`);
        } else if (nameMatch) {
            console.log(`    🛡️ XAVFSIZLIK ISHLADI: Tizim o'tkazmadi! Sabab: "NAME" `);
        }
    } else {
        console.log(`    ⚠️ XATO: Tizim ${name2} ismli xakerga ruxsat berdi!`);
    }

    console.log("\n=== TEST MUVAFFAQIYATLI YAKUNLANDI ===");

    // Cleanup afterwards
    await fetch(`${SUPABASE_URL}/rest/v1/submissions?deviceId=eq.${uniqueDeviceId}`, { method: 'DELETE', headers });
}

runTest().catch(console.error);
