import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Landing from '@/pages/Landing'
import Dashboard from '@/pages/Dashboard'
import './App.css'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Layout>
  )
}

export default App
