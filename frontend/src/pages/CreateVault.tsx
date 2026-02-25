import React, { useState } from 'react'
import './CreateVault.css'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import { Shield, Clock, Users, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useVault } from '@/hooks/useVault'

const CreateVault: React.FC = () => {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const { createVault } = useVault()
    const [errors, setErrors] = useState<Record<string, string>>({})

    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        conditionType: '1', // 1: Block Height, 2: Inactivity, 3: Threshold
        targetBlock: '',
        inactivityBlocks: '',
        threshold: '1',
        beneficiary: '',
        cosigners: [''],
    })

    const validateStep1 = (): boolean => {
        const errs: Record<string, string> = {}
        if (!formData.name.trim()) errs.name = 'Vault name is required.'
        const amount = Number(formData.amount)
        if (!formData.amount || isNaN(amount) || amount <= 0) errs.amount = 'Amount must be a positive number.'
        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    const validateStep2 = (): boolean => {
        const errs: Record<string, string> = {}
        const type = formData.conditionType
        if (type === '1') {
            const block = Number(formData.targetBlock)
            if (!formData.targetBlock || isNaN(block) || block <= 0) errs.targetBlock = 'Target block must be a positive number.'
        } else if (type === '2') {
            const blocks = Number(formData.inactivityBlocks)
            if (!formData.inactivityBlocks || isNaN(blocks) || blocks <= 0) errs.inactivityBlocks = 'Inactivity threshold must be a positive number.'
        } else if (type === '3') {
            const thresh = Number(formData.threshold)
            if (!formData.threshold || isNaN(thresh) || thresh <= 0) errs.threshold = 'Required approvals must be at least 1.'
        }
        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    const validateStep3 = (): boolean => {
        const errs: Record<string, string> = {}
        if (!formData.beneficiary.trim()) {
            errs.beneficiary = 'Beneficiary address is required.'
        } else if (!formData.beneficiary.startsWith('SP') && !formData.beneficiary.startsWith('ST')) {
            errs.beneficiary = 'Must be a valid STX address (starts with SP or ST).'
        }
        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    const handleNext = () => {
        let valid = true
        if (step === 1) valid = validateStep1()
        else if (step === 2) valid = validateStep2()
        else if (step === 3) valid = validateStep3()
        if (valid) setStep(s => s + 1)
    }

    const handleBack = () => {
        setErrors({})
        setStep(s => s - 1)
    }

    const handleSubmit = async () => {
        try {
            const amount = parseInt(formData.amount)
            const type = parseInt(formData.conditionType)
            const target = parseInt(formData.targetBlock) || 0
            const inactivity = parseInt(formData.inactivityBlocks) || 0
            const threshold = parseInt(formData.threshold) || 1

            await createVault(amount, type, target, inactivity, threshold, formData.beneficiary)
            setStep(5) // Success step
        } catch (error) {
            console.error('Failed to create vault:', error)
            // For now, just show success for demo if it's a cancelled tx
            // setStep(5)
        }
    }

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="form-step animate-slide-up">
                        <h2 className="font-heading">Base Information</h2>
                        <p className="text-secondary">Give your vault a name and specify the STX amount to lock.</p>
                        <Input
                            label="Vault Name"
                            placeholder="e.g. My Savings"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            error={errors.name}
                        />
                        <Input
                            label="Amount (STX)"
                            type="number"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            error={errors.amount}
                        />
                        <div className="step-actions">
                            <Button onClick={handleNext} rightIcon={<ArrowRight size={18} />}>Next Step</Button>
                        </div>
                    </div>
                )
            case 2:
                return (
                    <div className="form-step animate-slide-up">
                        <h2 className="font-heading">Activation Condition</h2>
                        <p className="text-secondary">Choose how and when your assets should be released.</p>

                        <div className="condition-types">
                            {[
                                { id: '1', name: 'Block Height', icon: <Shield size={20} /> },
                                { id: '2', name: 'Inactivity', icon: <Clock size={20} /> },
                                { id: '3', name: 'Threshold Approval', icon: <Users size={20} /> }
                            ].map(t => (
                                <div
                                    key={t.id}
                                    className={`condition-type-card glass ${formData.conditionType === t.id ? 'active' : ''}`}
                                    onClick={() => setFormData({ ...formData, conditionType: t.id })}
                                >
                                    {t.icon}
                                    <span>{t.name}</span>
                                </div>
                            ))}
                        </div>

                        {formData.conditionType === '1' && (
                            <Input
                                label="Target Block Height"
                                type="number"
                                placeholder="e.g. 150000"
                                value={formData.targetBlock}
                                onChange={e => setFormData({ ...formData, targetBlock: e.target.value })}
                                error={errors.targetBlock}
                            />
                        )}
                        {formData.conditionType === '2' && (
                            <Input
                                label="Inactivity Threshold (Blocks)"
                                type="number"
                                placeholder="e.g. 2000"
                                helpText="~2 weeks at 10m/block"
                                value={formData.inactivityBlocks}
                                onChange={e => setFormData({ ...formData, inactivityBlocks: e.target.value })}
                                error={errors.inactivityBlocks}
                            />
                        )}
                        {formData.conditionType === '3' && (
                            <Input
                                label="Required Approvals"
                                type="number"
                                placeholder="1"
                                value={formData.threshold}
                                onChange={e => setFormData({ ...formData, threshold: e.target.value })}
                                error={errors.threshold}
                            />
                        )}

                        <div className="step-actions">
                            <Button variant="ghost" onClick={handleBack} leftIcon={<ArrowLeft size={18} />}>Back</Button>
                            <Button onClick={handleNext} rightIcon={<ArrowRight size={18} />}>Next Step</Button>
                        </div>
                    </div>
                )
            case 3:
                return (
                    <div className="form-step animate-slide-up">
                        <h2 className="font-heading">Trust Delegation</h2>
                        <p className="text-secondary">Specify who receives the assets and who must approve the release.</p>
                        <Input
                            label="Beneficiary STX Address"
                            placeholder="SP..."
                            value={formData.beneficiary}
                            onChange={e => setFormData({ ...formData, beneficiary: e.target.value })}
                            error={errors.beneficiary}
                        />

                        <div className="step-actions">
                            <Button variant="ghost" onClick={handleBack} leftIcon={<ArrowLeft size={18} />}>Back</Button>
                            <Button onClick={handleNext} rightIcon={<ArrowRight size={18} />}>Review Vault</Button>
                        </div>
                    </div>
                )
            case 4:
                return (
                    <div className="form-step animate-slide-up">
                        <h2 className="font-heading">Review & Confirm</h2>
                        <Card className="review-card">
                            <div className="review-item">
                                <span>Vault Name</span>
                                <strong>{formData.name || 'Untitled'}</strong>
                            </div>
                            <div className="review-item">
                                <span>Amount</span>
                                <strong>{formData.amount || '0'} STX</strong>
                            </div>
                            <div className="review-item">
                                <span>Release Condition</span>
                                <strong>{formData.conditionType === '1' ? 'Block Height' : formData.conditionType === '2' ? 'Inactivity' : 'Threshold'}</strong>
                            </div>
                            <div className="review-item">
                                <span>Beneficiary</span>
                                <code className="text-xs">{formData.beneficiary || 'Not specified'}</code>
                            </div>
                        </Card>
                        <div className="step-actions">
                            <Button variant="ghost" onClick={handleBack} leftIcon={<ArrowLeft size={18} />}>Back</Button>
                            <Button onClick={handleSubmit} variant="primary">Confirm & Transact</Button>
                        </div>
                    </div>
                )
            case 5:
                return (
                    <div className="success-step animate-fade">
                        <CheckCircle size={64} className="text-success" />
                        <h2 className="font-heading">Vault Created!</h2>
                        <p className="text-secondary">Your transaction has been submitted to the Stacks network. It will appear on your dashboard once confirmed.</p>
                        <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
                    </div>
                )
        }
    }

    return (
        <div className="create-vault-page">
            <div className="stepper-nav">
                {[1, 2, 3, 4].map(s => (
                    <div key={s} className={`step-dot ${step === s ? 'active' : ''} ${step > s ? 'completed' : ''}`}>
                        {step > s ? <CheckCircle size={14} /> : s}
                    </div>
                ))}
            </div>

            <div className="form-container">
                {renderStep()}
            </div>
        </div>
    )
}

export default CreateVault
