interface 線框頁尾Props {
  版權?: string
  連結?: Array<{ 標籤: string; 連結: string }>
  顏色?: '主要' | '次要' | '成功' | '警告' | '錯誤' | '資訊'
  className?: string
}

export default function 線框頁尾({ 版權 = '© 2026 WebCube2027. 版權所有.', 連結, 顏色 = '資訊', className = '' }: 線框頁尾Props) {
  const 顏色類別 = {
    主要: 'text-blue-600 border-blue-600 hover:bg-blue-50',
    次要: 'text-gray-600 border-gray-600 hover:bg-gray-50',
    成功: 'text-green-600 border-green-600 hover:bg-green-50',
    警告: 'text-yellow-600 border-yellow-600 hover:bg-yellow-50',
    錯誤: 'text-red-600 border-red-600 hover:bg-red-50',
    資訊: 'text-indigo-600 border-indigo-600 hover:bg-indigo-50'
  }

  return (
    <footer className={`bg-gray-50 border-t-2 border-gray-300 mt-auto ${className}`}>
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600 font-medium">
            {版權}
          </div>
          {連結 && 連結.length > 0 && (
            <div className="flex space-x-4 text-sm">
              {連結.map((link) => (
                <a 
                  key={link.連結} 
                  href={link.連結} 
                  className={`px-3 py-1 border rounded transition-colors ${顏色類別[顏色]}`}
                >
                  {link.標籤}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}
