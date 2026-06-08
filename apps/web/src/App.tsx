import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { bootstrapAuth } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/routes/LoginPage';
import { DashboardPage } from '@/routes/DashboardPage';
import { PartsListPage } from '@/routes/PartsListPage';
import { PartDossierPage } from '@/routes/PartDossierPage';
import { PricingPage } from '@/routes/PricingPage';
import { QualityPage } from '@/routes/QualityPage';
import { ReportsPage } from '@/routes/ReportsPage';
import { AuditPage } from '@/routes/AuditPage';
import { AdminUsersPage } from '@/routes/AdminUsersPage';

function protect(element: JSX.Element) {
  return <ProtectedRoute>{element}</ProtectedRoute>;
}

export function App() {
  useEffect(() => {
    void bootstrapAuth();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={protect(<DashboardPage />)} />
        <Route path="/parts" element={protect(<PartsListPage />)} />
        <Route path="/parts/:id" element={protect(<PartDossierPage />)} />
        <Route path="/pricing" element={protect(<PricingPage />)} />
        <Route path="/quality" element={protect(<QualityPage />)} />
        <Route path="/reports" element={protect(<ReportsPage />)} />
        <Route path="/audit" element={protect(<AuditPage />)} />
        <Route path="/admin/users" element={protect(<AdminUsersPage />)} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
