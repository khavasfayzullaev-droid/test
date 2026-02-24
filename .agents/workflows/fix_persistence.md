# Plan: Fix Test Persistence and Save Feedback

The objective is to fix two critical issues:
1. **Save Feedback**: The "Testni Saqlash" button saves data but doesn't show the success alert or redirect.
2. **Access via Link**: Students cannot access tests via links because the page redirects to home before the tests are loaded from the database.

## Tasks

### 1. Update TestContext for Reliability
- Ensure `loading` state is handled correctly.
- Add error handling for Supabase operations that can be caught by the UI.

### 2. Fix Redirect Race Condition in Pages
- **DirectTakeTest.jsx**: Wait for `loading === false` before alerting "Test not found".
- **TakeTest.jsx**: Same as above.
- **TestResults.jsx**: Same as above.
- **TeacherDashboard.jsx**: Show loading spinner if data is still fetching.

### 3. Polish CreateTest UI Feedback
- Ensure `handleSave` correctly awaits the async `addTest` call and proceeds to redirect.
