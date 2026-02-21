import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import ProjectList from './pages/projects/ProjectList';
import ProjectDetails from './pages/projects/ProjectDetails';
import LoansList from './pages/loans/LoansList';
import ShopDetails from './pages/loans/ShopDetails';
import Reports from './pages/Reports';
import MainLayout from './components/Layout/MainLayout';

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/*"
                        element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <Routes>
                                        <Route path="/" element={<Dashboard />} />
                                        <Route path="/projects" element={<ProjectList />} />
                                        <Route path="/projects/:id" element={<ProjectDetails />} />
                                        <Route path="/loans" element={<LoansList />} />
                                        <Route path="/loans/shop/:shopName" element={<ShopDetails />} />
                                        <Route path="/reports" element={<Reports />} />
                                        <Route path="*" element={<Navigate to="/" replace />} />
                                    </Routes>
                                </MainLayout>
                            </ProtectedRoute>
                        }
                    />
                    {/* Catch all route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
