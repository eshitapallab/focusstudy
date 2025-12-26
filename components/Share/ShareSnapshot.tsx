'use client'

import { VerdictStatus } from '@/lib/types'
import { useRef } from 'react'

interface ShareSnapshotProps {
  status: VerdictStatus
  hoursStudied: number
  exam: string
  streak?: number
}

export default function ShareSnapshot({ status, hoursStudied, exam, streak }: ShareSnapshotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const getStatusEmoji = (status: VerdictStatus) => {
    switch (status) {
      case 'on-track': return '🟢'
      case 'at-risk': return '🟡'
      case 'falling-behind': return '🔴'
    }
  }

  const getStatusText = (status: VerdictStatus) => {
    switch (status) {
      case 'on-track': return 'On Track'
      case 'at-risk': return 'At Risk'
      case 'falling-behind': return 'Falling Behind'
    }
  }

  const generateImage = async (): Promise<string> => {
    const canvas = canvasRef.current
    if (!canvas) throw new Error('Canvas not available')

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context not available')

    // Set canvas size
    canvas.width = 1080
    canvas.height = 1080

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#3B82F6') // blue-600
    gradient.addColorStop(1, '#1E40AF') // blue-800
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // White card
    ctx.fillStyle = '#FFFFFF'
    ctx.roundRect(60, 200, canvas.width - 120, 680, 24)
    ctx.fill()

    // Status emoji
    ctx.font = 'bold 120px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(getStatusEmoji(status), canvas.width / 2, 380)

    // Status text
    ctx.font = 'bold 64px Arial'
    ctx.fillStyle = '#111827'
    ctx.fillText(getStatusText(status), canvas.width / 2, 480)

    // Hours studied
    ctx.font = 'bold 96px Arial'
    ctx.fillStyle = '#3B82F6'
    ctx.fillText(`${hoursStudied.toFixed(1)}h`, canvas.width / 2, 620)

    ctx.font = '36px Arial'
    ctx.fillStyle = '#6B7280'
    ctx.fillText('today', canvas.width / 2, 670)

    // Streak (if exists)
    if (streak && streak > 0) {
      ctx.font = '32px Arial'
      ctx.fillStyle = '#EF4444'
      ctx.fillText(`🔥 ${streak} day streak`, canvas.width / 2, 750)
    }

    // Exam name
    ctx.font = 'bold 28px Arial'
    ctx.fillStyle = '#9CA3AF'
    ctx.fillText(exam.toUpperCase(), canvas.width / 2, 820)

    // App name
    ctx.font = '24px Arial'
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.fillText('StudyTrack', canvas.width / 2, 980)

    return canvas.toDataURL('image/png')
  }

  const shareToWhatsApp = async () => {
    try {
      const imageData = await generateImage()
      
      // Convert data URL to blob
      const response = await fetch(imageData)
      const blob = await response.blob()
      const file = new File([blob], 'study-progress.png', { type: 'image/png' })

      // Use Web Share API if available
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Study Progress',
          text: `Today: ${getStatusText(status)} ${getStatusEmoji(status)} | ${hoursStudied.toFixed(1)} hrs`
        })
      } else {
        // Fallback: download image
        const link = document.createElement('a')
        link.href = imageData
        link.download = 'study-progress.png'
        link.click()
      }
    } catch (error) {
      console.error('Share failed:', error)
      alert('Sharing not available. Image will be downloaded instead.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Hidden canvas for image generation */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Share card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <h3 className="font-medium mb-2">Share your progress</h3>
        <p className="text-sm text-blue-100 mb-4">
          Inspire others on their prep journey
        </p>

        <button
          onClick={shareToWhatsApp}
          className="w-full py-3 bg-white text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
        >
          <span>📤</span>
          <span>Share snapshot</span>
        </button>
      </div>
    </div>
  )
}
