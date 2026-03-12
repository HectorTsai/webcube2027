interface 圖示Props {
  id: string        // 圖示 ID
  size?: number | string
  className?: string
}

export default async function 圖示({ id, size, className }: 圖示Props) {
  // 直接呼叫 API
  const response = await fetch(`/api/icons/${id}`)
  
  if (!response.ok) {
    // API 失敗時的後備
    return <FallbackIcon size={size} className={className} />
  }
  
  const iconData = await response.json()
  
  // 根據格式渲染
  switch (iconData.格式) {
    case 'SVG':
      return (
        <span 
          className={className}
          style={{ width: size, height: size }}
          dangerouslySetInnerHTML={{ __html: iconData.內容 }} 
        />
      )
      
    case 'PNG':
    case 'ICO':
      return (
        <img 
          src={iconData.內容}
          alt={iconData.名稱 || '圖示'}
          width={size}
          height={size}
          className={className}
        />
      )
      
    case 'HTML':
      return (
        <div 
          className={className}
          style={{ width: size, height: size }}
          dangerouslySetInnerHTML={{ __html: iconData.內容 }} 
        />
      )
      
    default:
      return <FallbackIcon size={size} className={className} />
  }
}

function FallbackIcon({ size, className }: {
  size?: number | string
  className?: string
}) {
  return (
    <div 
      className={`animate-spin ${className || ''}`}
      style={{ 
        width: size || 24, 
        height: size || 24,
        border: '2px solid currentColor',
        borderTopColor: 'transparent',
        borderRadius: '50%'
      }}
    />
  )
}
