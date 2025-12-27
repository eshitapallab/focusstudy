'use client'

import { stringToColor, getInitials, getAvatarEmoji, getContrastColor } from '@/lib/avatarUtils'

interface MemberAvatarProps {
  name: string
  odorId?: string
  size?: 'sm' | 'md' | 'lg'
  showEmoji?: boolean
  isOnline?: boolean
  isOwner?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg'
}

export default function MemberAvatar({ 
  name, 
  odorId,
  size = 'md', 
  showEmoji = false,
  isOnline = false,
  isOwner = false,
  className = ''
}: MemberAvatarProps) {
  const bgColor = stringToColor(odorId || name)
  const textColor = getContrastColor(bgColor)
  const initials = getInitials(name)
  const emoji = getAvatarEmoji(odorId || name)

  return (
    <div className={`relative inline-flex ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold shadow-md transition-transform hover:scale-105`}
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        {showEmoji ? emoji : initials}
      </div>
      
      {/* Online indicator */}
      {isOnline && (
        <span className="absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-800">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>
        </span>
      )}
      
      {/* Owner crown */}
      {isOwner && (
        <span className="absolute -top-1 -right-1 text-xs">👑</span>
      )}
    </div>
  )
}
