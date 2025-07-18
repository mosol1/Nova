import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Login from './pages/Login';

import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';

// Components
import Navbar from './components/layout/Navbar';
import Hero from './components/sections/Hero';
import Products from './components/sections/Products';
import Features from './components/sections/Features';
import Footer from './components/sections/Footer';

// Home page component
const HomePage = () => (
  <div className="min-h-screen bg-black text-white overflow-x-hidden relative">
    {/* Scan Lines Effect */}
    <div className="fixed inset-0 scan-lines pointer-events-none z-50 opacity-20" />
    
    <Navbar />
    <main>
      <Hero />
      <Products />
      <Features />
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirect unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;