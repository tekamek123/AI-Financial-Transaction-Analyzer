'use client'

import { useState, useCallback } from 'react'
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useToastHelpers } from './Toast'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onFileRemove: () => void
  acceptedFormats?: string[]
  maxSize?: number // in MB
  className?: string
}

export default function FileUpload({
  onFileSelect,
  onFileRemove,
  acceptedFormats = ['.csv', '.json'],
  maxSize = 10, // 10MB default
  className = ''
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { error: showError, success: showSuccess } = useToastHelpers()

  const validateFile = useCallback((file: File): boolean => {
    // Check file format
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedFormats.includes(fileExtension)) {
      const errorMessage = `Invalid file format. Accepted formats: ${acceptedFormats.join(', ')}`
      setError(errorMessage)
      showError('Invalid File', errorMessage)
      return false
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSize) {
      const errorMessage = `File size exceeds ${maxSize}MB limit. Current size: ${fileSizeMB.toFixed(2)}MB`
      setError(errorMessage)
      showError('File Too Large', errorMessage)
      return false
    }

    setError(null)
    return true
  }, [acceptedFormats, maxSize, showError])

  const handleFileSelect = useCallback((file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file)
      onFileSelect(file)
      showSuccess('File Selected', `${file.name} ready for upload`)
    }
  }, [validateFile, onFileSelect, showSuccess])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null)
    setError(null)
    onFileRemove()
  }, [onFileRemove])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'csv':
        return <DocumentIcon className="h-8 w-8 text-green-500" />
      case 'json':
        return <DocumentIcon className="h-8 w-8 text-blue-500" />
      default:
        return <DocumentIcon className="h-8 w-8 text-gray-500" />
    }
  }

  if (selectedFile) {
    return (
      <div className={`border rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {getFileIcon(selectedFile.name)}
            <div>
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
      isDragging 
        ? 'border-blue-500 bg-blue-50' 
        : 'border-gray-300 hover:border-gray-400'
    } ${className}`}>
      <div className="space-y-4">
        <div className="flex justify-center">
          <CloudArrowUpIcon className="h-12 w-12 text-gray-400" />
        </div>
        
        <div>
          <p className="text-lg font-medium text-gray-900">
            {isDragging ? 'Drop your file here' : 'Upload transaction data'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Drag and drop your file here, or click to browse
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            Accepted formats: {acceptedFormats.join(', ')}
          </p>
          <p className="text-xs text-gray-500">
            Maximum file size: {maxSize}MB
          </p>
        </div>

        <div className="flex justify-center">
          <label className="btn btn-outline cursor-pointer">
            Choose File
            <input
              type="file"
              className="hidden"
              accept={acceptedFormats.join(',')}
              onChange={handleFileInputChange}
            />
          </label>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Hidden drag overlay */}
      <div
        className={`absolute inset-0 rounded-lg transition-opacity ${
          isDragging ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />
    </div>
  )
}
