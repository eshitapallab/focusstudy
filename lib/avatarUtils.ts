// Generate a consistent color based on string (user ID or name)
export function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // Generate vibrant colors by using HSL with high saturation
  const h = Math.abs(hash % 360)
  const s = 65 + (hash % 20) // 65-85%
  const l = 55 + (hash % 15) // 55-70%
  
  return `hsl(${h}, ${s}%, ${l}%)`
}

// Get initials from display name
export function getInitials(name: string): string {
  if (!name) return '?'
  
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Avatar emojis for variety
const AVATAR_EMOJIS = ['🦊', '🐼', '🦁', '🐯', '🐨', '🐰', '🦄', '🐸', '🦋', '🌟', '🔥', '💎', '🎯', '🚀', '⭐', '🌈']

export function getAvatarEmoji(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_EMOJIS[Math.abs(hash) % AVATAR_EMOJIS.length]
}

// Get contrasting text color (black or white) for background
export function getContrastColor(bgColor: string): string {
  // For HSL colors, check lightness
  const match = bgColor.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/)
  if (match) {
    const l = parseInt(match[3])
    return l > 60 ? '#1a1a1a' : '#ffffff'
  }
  return '#ffffff'
}
