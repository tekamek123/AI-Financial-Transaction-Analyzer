'use client'

import { useState } from 'react'
import { 
  SparklesIcon, 
  InformationCircleIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from './LoadingSpinner'
import { useToastHelpers } from './Toast'

interface AIExplanation {
  transaction_id: string
  explanation_type: 'fraud_probability' | 'risk_factors' | 'pattern_analysis' | 'recommendation' | 'model_confidence'
  title: string
  content: string
  confidence_score: number
  risk_factors: string[]
  recommendations: string[]
  model_version: string
  generated_at: string
}

interface AIExplanationPanelProps {
  transactionId: string
  explanations: AIExplanation[]
  isLoading?: boolean
  className?: string
}

export default function AIExplanationPanel({ 
  transactionId, 
  explanations, 
  isLoading = false,
  className = ''
}: AIExplanationPanelProps) {
  const [selectedExplanation, setSelectedExplanation] = useState<AIExplanation | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const { success: showSuccess } = useToastHelpers()

  const getExplanationIcon = (type: string) => {
    switch (type) {
      case 'fraud_probability':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      case 'risk_factors':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />
      case 'pattern_analysis':
        return <SparklesIcon className="h-5 w-5 text-purple-500" />
      case 'recommendation':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'model_confidence':
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 75) return 'text-blue-600 bg-blue-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const toggleSection = (explanationId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(explanationId)) {
      newExpanded.delete(explanationId)
    } else {
      newExpanded.add(explanationId)
    }
    setExpandedSections(newExpanded)
  }

  const handleExport = () => {
    const explanationText = explanations.map(exp => 
      `${exp.title}\n${'='.repeat(50)}\n${exp.content}\n\nRisk Factors: ${exp.risk_factors.join(', ')}\n\nRecommendations: ${exp.recommendations.join(', ')}\n\nConfidence: ${exp.confidence_score}%\n\n${'='.repeat(50)}\n`
    ).join('\n')

    const blob = new Blob([explanationText], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ai_explanation_${transactionId}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    showSuccess('Export Successful', 'AI explanation has been exported')
  }

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner />
          <span className="ml-3 text-gray-600">Generating AI explanations...</span>
        </div>
      </div>
    )
  }

  if (explanations.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Explanations Available</h3>
          <p className="text-gray-600">
            AI explanations will be generated once the transaction is analyzed by our fraud detection models.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">AI Analysis Explanation</h3>
            <p className="text-sm text-gray-500 mt-1">
              Transaction ID: {transactionId}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleExport}
              className="btn btn-outline"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Explanation List */}
      <div className="divide-y divide-gray-200">
        {explanations.map((explanation, index) => (
          <div key={explanation.explanation_type} className="p-4">
            {/* Explanation Header */}
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection(explanation.explanation_type)}
            >
              <div className="flex items-center space-x-3">
                {getExplanationIcon(explanation.explanation_type)}
                <h4 className="text-md font-medium text-gray-900">
                  {explanation.title}
                </h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(explanation.confidence_score)}`}>
                  {explanation.confidence_score}% confidence
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  Model v{explanation.model_version}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(explanation.generated_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Expandable Content */}
            {expandedSections.has(explanation.explanation_type) && (
              <div className="mt-4 space-y-4">
                {/* Main Content */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {explanation.content}
                  </p>
                </div>

                {/* Risk Factors */}
                {explanation.risk_factors.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Key Risk Factors:</h5>
                    <div className="space-y-2">
                      {explanation.risk_factors.map((factor, factorIndex) => (
                        <div key={factorIndex} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-1 flex-shrink-0"></div>
                          <p className="text-sm text-gray-700">{factor}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {explanation.recommendations.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Recommendations:</h5>
                    <div className="space-y-2">
                      {explanation.recommendations.map((recommendation, recIndex) => (
                        <div key={recIndex} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
                          <p className="text-sm text-gray-700">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confidence Details */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">Model Confidence</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${explanation.confidence_score}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-blue-900">
                        {explanation.confidence_score}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    This confidence score indicates how certain the AI model is about this analysis.
                    Higher scores suggest more reliable predictions.
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Generated by AI Model v{explanations[0]?.model_version || 'N/A'}
          </span>
          <span>
            Last updated: {explanations[0] ? new Date(explanations[0].generated_at).toLocaleString() : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  )
}
