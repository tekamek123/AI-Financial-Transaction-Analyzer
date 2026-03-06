'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeftIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import FileUpload from '@/components/FileUpload'
import LoadingSpinner from '@/components/LoadingSpinner'
import { apiClient, handleApiError } from '@/utils/api'
import { useToastHelpers } from '@/components/Toast'

export default function UploadTransactions() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const { success: showSuccess, error: showError } = useToastHelpers()

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      
      return apiClient.transactions.uploadTransactions(file)
    },
    onSuccess: (data) => {
      setUploadResult(data.data)
      setUploadProgress(100)
      showSuccess('Upload Successful', `Processed ${data.data.processed_count} transactions`)
    },
    onError: (error) => {
      const apiError = handleApiError(error)
      showError('Upload Failed', apiError.message)
      setUploadProgress(0)
    },
  })

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setUploadResult(null)
    setUploadProgress(0)
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
    setUploadResult(null)
    setUploadProgress(0)
  }

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setUploadResult(null)
    setUploadProgress(0)
    uploadMutation.reset()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/transactions"
              className="inline-flex items-center text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Transactions
            </Link>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900">
            Upload Transaction Data
          </h1>
          <p className="mt-2 text-gray-600">
            Upload CSV or JSON files containing transaction data for analysis
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Select File
          </h2>
          
          <FileUpload
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            acceptedFormats={['.csv', '.json']}
            maxSize={50} // 50MB
          />
        </div>

        {/* Upload Action */}
        {selectedFile && !uploadResult && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Ready to Upload
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  File: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleReset}
                  className="btn btn-outline"
                  disabled={uploadMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className="btn btn-primary"
                  disabled={uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? (
                    <div className="flex items-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      Uploading...
                    </div>
                  ) : (
                    'Upload & Analyze'
                  )}
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            {uploadMutation.isPending && (
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  {uploadProgress}% complete
                </p>
              </div>
            )}
          </div>
        )}

        {/* Upload Results */}
        {uploadResult && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Upload Completed Successfully
                </h3>
                <p className="text-sm text-gray-500">
                  Your transaction data has been processed and analyzed
                </p>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {uploadResult.processed_count || 0}
                </p>
                <p className="text-sm text-gray-500">Transactions Processed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {uploadResult.suspicious_count || 0}
                </p>
                <p className="text-sm text-gray-500">Suspicious Transactions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {uploadResult.alerts_generated || 0}
                </p>
                <p className="text-sm text-gray-500">Alerts Generated</p>
              </div>
            </div>

            {/* Warnings */}
            {uploadResult.warnings && uploadResult.warnings.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Warnings</h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {uploadResult.warnings.map((warning: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3">
              <Link href="/transactions" className="btn btn-primary">
                View Transactions
              </Link>
              <Link href="/alerts" className="btn btn-secondary">
                View Alerts
              </Link>
              <button onClick={handleReset} className="btn btn-outline">
                Upload Another File
              </button>
            </div>
          </div>
        )}

        {/* File Format Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">
            File Format Guide
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-2">CSV Format</h4>
              <p className="text-sm text-blue-700 mb-2">
                CSV files should contain the following columns:
              </p>
              <code className="text-xs bg-blue-100 text-blue-800 p-2 rounded block">
                transaction_id, amount, timestamp, merchant, category, account_id
              </code>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-2">JSON Format</h4>
              <p className="text-sm text-blue-700 mb-2">
                JSON files should be an array of transaction objects:
              </p>
              <pre className="text-xs bg-blue-100 text-blue-800 p-2 rounded overflow-x-auto">
{`[
  {
    "transaction_id": "txn_001",
    "amount": 1250.00,
    "timestamp": "2024-01-15T10:30:00Z",
    "merchant": "Amazon",
    "category": "Retail",
    "account_id": "ACC123"
  }
]`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
