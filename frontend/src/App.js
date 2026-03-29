import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Transactions from './pages/Transactions/Transactions';
import Badges from './pages/Badges/Badges';
import Leaderboard from './pages/Leaderboard/Leaderboard';
import Profile from './pages/Profile/Profile';
import Challenges from './pages/Challenges/Challenges';
import PlayGames from './pages/Games/PlayGames';
import AdminDashboard from './pages/Admin/AdminDashboard';
import Coupons from './pages/Coupons/Coupons';
import MyCoupons from './pages/Coupons/MyCoupons';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Role-based redirect component
const RoleBasedRedirect = () => {
  const { user } = useAuth();
  
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  } else {
    return <Navigate to="/dashboard" replace />;
  }
};

// Admin Route Component (only accessible to admin users)
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component (redirects to appropriate dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user) {
    // Redirect based on user role
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />

        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <RoleBasedRedirect />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/transactions" 
          element={
            <ProtectedRoute>
              <Layout>
                <Transactions />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/badges" 
          element={
            <ProtectedRoute>
              <Layout>
                <Badges />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/leaderboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <Leaderboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/challenges" 
          element={
            <ProtectedRoute>
              <Layout>
                <Challenges />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/play-games" 
          element={
            <ProtectedRoute>
              <Layout>
                <PlayGames />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/coupons" 
          element={
            <ProtectedRoute>
              <Layout>
                <Coupons />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-coupons" 
          element={
            <ProtectedRoute>
              <Layout>
                <MyCoupons />
              </Layout>
            </ProtectedRoute>
          } 
        />
        {/* /admin/* keeps one Layout + AdminDashboard instance; sidebar URLs like /admin/games sync the active tab */}
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <Layout>
                <AdminDashboard />
              </Layout>
            </AdminRoute>
          }
        />

        {/* 404 Route */}
        <Route 
          path="*" 
          element={
            <ProtectedRoute>
              <Layout>
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
                    <p className="text-xl text-gray-600 mb-8">Page not found</p>
                    <RoleBasedRedirect />
                  </div>
                </div>
              </Layout>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;
