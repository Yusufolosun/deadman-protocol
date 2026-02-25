import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import Landing from '@/pages/Landing'
import Dashboard from '@/pages/Dashboard'
import CreateVault from '@/pages/CreateVault'
import VaultDetail from '@/pages/VaultDetail'
import ActivityPage from '@/pages/Activity'
import Approvals from '@/pages/Approvals'
import SettingsPage from '@/pages/Settings'
import './App.css'

function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vault/create" element={<CreateVault />} />
          <Route path="/vault/:id" element={<VaultDetail />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  )
}

export default App
