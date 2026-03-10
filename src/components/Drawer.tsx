interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  children: any
  position?: 'left' | 'right'
}

export function Drawer({ isOpen, onClose, children, position = 'left' }: DrawerProps) {
  if (!isOpen) return null

  const positionClasses = position === 'left' 
    ? 'translate-x-0' 
    : 'translate-x-0'

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* 側邊欄 */}
      <div className={`fixed inset-y-0 ${position === 'left' ? 'left-0' : 'right-0'} w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ${positionClasses}`}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">選單</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-2">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

export default Drawer
