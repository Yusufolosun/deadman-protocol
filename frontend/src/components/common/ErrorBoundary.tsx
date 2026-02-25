import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import Button from './Button'
import './ErrorBoundary.css'

interface ErrorBoundaryProps {
    children: ReactNode
    fallback?: ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error('ErrorBoundary caught:', error, info.componentStack)
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null })
    }

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }
            return (
                <div className="error-boundary">
                    <h2 className="error-boundary-title">Something went wrong</h2>
                    <p className="error-boundary-message">
                        {this.state.error?.message || 'An unexpected error occurred.'}
                    </p>
                    <Button onClick={this.handleReset} variant="secondary">
                        Try Again
                    </Button>
                </div>
            )
        }
        return this.props.children
    }
}

export default ErrorBoundary
