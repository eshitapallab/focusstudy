interface FocusStudyLogoProps {
  size?: number
  color?: string
  className?: string
}

/**
 * FocusStudy Logo - "Focus Ring"
 * A soft, partially open circular ring representing calm focus
 */
export default function FocusStudyLogo({ 
  size = 40, 
  color = 'currentColor',
  className = '' 
}: FocusStudyLogoProps) {
  // Calculate dimensions
  const strokeWidth = Math.max(2, size * 0.08) // Medium stroke width
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  
  // Ring is 87% complete (13% open at top-right)
  const openingPercent = 0.13
  const strokeDasharray = `${circumference * (1 - openingPercent)} ${circumference * openingPercent}`
  
  // Rotate to position opening at top-right (starts at -45deg)
  const rotation = -45

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="FocusStudy Logo"
      role="img"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={strokeDasharray}
        transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
        style={{
          transition: 'stroke 0.2s ease',
        }}
      />
    </svg>
  )
}
