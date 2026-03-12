interface 幽靈頁尾Props {
  版權?: string
  連結?: Array<{ 標籤: string; 連結: string }>
  顏色?: '主要' | '次要' | '成功' | '警告' | '錯誤' | '資訊'
  className?: string
}

export default function 幽靈頁尾({ 版權 = '© 2026 WebCube2027. 版權所有.', 連結, 顏色 = '次要', className = '' }: 幽靈頁尾Props) {
  const 顏色類別 = {
    主要: 'text-blue-400 hover:text-blue-300',
    次要: 'text-gray-400 hover:text-gray-300',
    成功: 'text-green-400 hover:text-green-300',
    警告: 'text-yellow-400 hover:text-yellow-300',
    錯誤: 'text-red-400 hover:text-red-300',
    資訊: 'text-indigo-400 hover:text-indigo-300'
  }

  return (
    <footer className={`bg-transparent border-t border-gray-800 mt-auto ${className}`}>
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            {版權}
          </div>
          {連結 && 連結.length > 0 && (
            <div className={`flex space-x-6 text-sm ${顏色類別[顏色]}`}>
              {連結.map((link) => (
                <a key={link.連結} href={link.連結} className="hover:opacity-80">
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
