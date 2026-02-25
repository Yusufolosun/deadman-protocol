import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Landing from '@/pages/Landing'
import Dashboard from '@/pages/Dashboard'
import CreateVault from '@/pages/CreateVault'
import VaultDetail from '@/pages/VaultDetail'
import ActivityPage from '@/pages/Activity'
import Approvals from '@/pages/Approvals'
import SettingsPage from '@/pages/Settings'
import NotFound from '@/pages/NotFound'
import './App.css'

function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/vault/create" element={<ProtectedRoute><CreateVault /></ProtectedRoute>} />
          <Route path="/vault/:id" element={<ProtectedRoute><VaultDetail /></ProtectedRoute>} />
          <Route path="/activity" element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
          <Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  )
}

export default App
