interface CardProps {
  children: any
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className = '', padding = 'md', shadow = 'md' }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow',
    lg: 'shadow-lg'
  }

  return (
    <div className={`bg-white rounded-lg ${shadowClasses[shadow]} ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  )
}

export default Card
