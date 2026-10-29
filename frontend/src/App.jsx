import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import TicketListPage from './pages/TicketListPage';
import CreateTicketPage from './pages/CreateTicketPage';
import AIChatWidget from './components/AIChatWidget';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/tickets" element={<TicketListPage />} />
            <Route path="/create-ticket" element={<CreateTicketPage />} />
          </Routes>
        </main>
        {/* Global Floating AI Chat Bot */}
        <AIChatWidget />
      </div>
    </Router>
  );
}

export default App;