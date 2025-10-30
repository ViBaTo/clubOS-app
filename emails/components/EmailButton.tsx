import { Button } from '@react-email/components'
import { ReactNode } from 'react'

interface EmailButtonProps {
  href: string
  children: ReactNode
  variant?: 'primary' | 'secondary'
  style?: React.CSSProperties
}

export default function EmailButton({ 
  href, 
  children, 
  variant = 'primary', 
  style = {} 
}: EmailButtonProps) {
  const baseStyle = {
    display: 'inline-block',
    padding: '14px 28px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '16px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s ease',
    ...style,
  }

  const primaryStyle = {
    ...baseStyle,
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
  }

  const secondaryStyle = {
    ...baseStyle,
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
  }

  const buttonStyle = variant === 'primary' ? primaryStyle : secondaryStyle

  return (
    <Button href={href} style={buttonStyle}>
      {children}
    </Button>
  )
}