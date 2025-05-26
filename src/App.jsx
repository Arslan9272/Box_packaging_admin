import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Overview from './pages/Overview';
import Products from './pages/Products';
import Settings from './pages/Settings';
import Login from './pages/login';
import Chat from './pages/chat';

// For debugging purposes
console.log("Layout component:", Layout);
console.log("Overview component:", Overview);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route path="/home" element={
          <Layout>
            <Overview />
          </Layout>
        } />
        
        <Route path="/overview" element={
          <Layout>
            <Overview />
          </Layout>
        } />
        
        <Route path="/products" element={
          <Layout>
            <Products />
          </Layout>
        } />
        
        <Route path="/settings" element={
          <Layout>
            <Settings />
          </Layout>
        } />

          <Route path="/chat" element={
          <Layout>
            <Chat />
          </Layout>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;