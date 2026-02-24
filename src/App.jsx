import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { TestProvider } from './context/TestContext';
import TeacherDashboard from './pages/TeacherDashboard';
import CreateTest from './pages/CreateTest';
import TestResults from './pages/TestResults';
import TakeTest from './pages/TakeTest';
import DirectTakeTest from './pages/DirectTakeTest';
import './App.css';

// Layout component
const Layout = ({ children }) => {
  const location = useLocation();
  const isStudentRoute = location.pathname.startsWith('/take/') || location.pathname.startsWith('/student/');

  return (
    <div className="app-layout">
      {!isStudentRoute && (
        <header className="glass" style={{ padding: '1rem 0', borderBottom: '1px solid var(--border-light)', position: 'sticky', top: 0, zIndex: 50 }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Brain size={24} color="var(--primary)" /> Tez Test Tuz
              </Link>
            </h1>
            <nav style={{ display: 'flex', gap: '1.5rem', fontWeight: 500 }}>
              <Link to="/teacher" style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--primary)', color: 'white' }}>O'qituvchi Bo'limi</Link>
            </nav>
          </div>
        </header>
      )}
      <main className="main-content container">
        {children}
      </main>
    </div>
  );
};

// Home Page
const Home = () => (
  <div style={{ textAlign: 'center', marginTop: '4rem' }} className="fade-in">
    <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', color: 'var(--text-main)', letterSpacing: '-0.03em', fontWeight: 800 }}>
      Test tayyorlash <br /> endi yanada oson.
    </h1>
    <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
      Ustozlar uchun mukammal test platformasi. Mashg'ulotlarni testlar bilan boyiting,
      bo'limlar orqali boshqaring va o'quvchilarga maxsus linklarni yuboring.
    </p>

    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
      <Link to="/teacher" className="btn btn-primary btn-lg" style={{ width: '250px', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        👨‍🏫 Boshqaruv Paneliga Kirish
      </Link>
    </div>
  </div>
);

function App() {
  return (
    <TestProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />

            {/* Teacher Routes */}
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/create" element={<CreateTest />} />
            <Route path="/teacher/edit/:editId" element={<CreateTest />} />
            <Route path="/teacher/results/:id" element={<TestResults />} />

            {/* Student Routes */}
            <Route path="/take/:id" element={<DirectTakeTest />} />
            <Route path="/student/test/:id" element={<TakeTest />} />
          </Routes>
        </Layout>
      </Router>
    </TestProvider>
  );
}

export default App;
