import React from 'react'
import Button from '@/components/common/Button'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import './NotFound.css'

const NotFound: React.FC = () => {
    const navigate = useNavigate()

    return (
        <div className="not-found-page animate-fade">
            <AlertTriangle size={64} className="not-found-icon" />
            <h1 className="font-heading">404 — Page Not Found</h1>
            <p className="text-secondary">The page you are looking for does not exist or has been moved.</p>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
    )
}

export default NotFound
