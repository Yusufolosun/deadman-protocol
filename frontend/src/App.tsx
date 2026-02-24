import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Landing from '@/pages/Landing'
import Dashboard from '@/pages/Dashboard'
import CreateVault from '@/pages/CreateVault'
import VaultDetail from '@/pages/VaultDetail'
import ActivityPage from '@/pages/Activity'
import './App.css'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vault/create" element={<CreateVault />} />
        <Route path="/vault/:id" element={<VaultDetail />} />
        <Route path="/activity" element={<ActivityPage />} />
      </Routes>
    </Layout>
  )
}

export default App
