import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Layout
import Layout from "./components/Layout";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/Calendar";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import AIAssistant from "./pages/AIAssistant";
import FocusMode from "./pages/FocusMode";
import StudyGroup from "./pages/StudyGroup";

// Protected Route
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" />
  );
};

// Public Route
const PublicRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return isAuthenticated ? (
    <Navigate to="/dashboard" />
  ) : (
    <>{children}</>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" />

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

          {/* Protected Routes with Sidebar Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/tasks"
              element={<Tasks />}
            />

            <Route
              path="/calendar"
              element={<Calendar />}
            />

            <Route
              path="/analytics"
              element={<Analytics />}
            />

            <Route
              path="/settings"
              element={<Settings />}
            />
          
            <Route
              path="/ai-assistant"
              element={<AIAssistant />}
            />
          
            <Route
              path="/study-group"
              element={<StudyGroup />}
            />
          </Route>
          
          {/* Focus Mode - Full screen, no layout */}
          <Route
            path="/focus-mode"
            element={
              <ProtectedRoute>
                <FocusMode />
              </ProtectedRoute>
            }
          />

          {/* Redirects */}
          <Route
            path="/"
            element={<Navigate to="/dashboard" />}
          />

          <Route
            path="*"
            element={<Navigate to="/dashboard" />}
          />
        </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;