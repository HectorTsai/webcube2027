export default function 測試樣式() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold mb-6">WebCube 樣式測試</h1>
      
      {/* 測試中文顏色類別 */}
      <div className="背景-主色 p-4 rounded-lg">
        <p className="文字-主色內容">背景-主色 + 文字-主色內容</p>
      </div>
      
      <div className="背景-次色 p-4 rounded-lg">
        <p className="文字-次色內容">背景-次色 + 文字-次色內容</p>
      </div>
      
      <div className="背景-強調色 p-4 rounded-lg">
        <p className="文字-強調色內容">背景-強調色 + 文字-強調色內容</p>
      </div>
      
      {/* 測試 UnoCSS 基礎類別 */}
      <div className="bg-blue-500 text-white p-4 rounded-lg">
        <p>標準 UnoCSS: bg-blue-500 + text-white</p>
      </div>
      
      <div className="bg-green-500 text-white p-4 rounded-lg">
        <p>標準 UnoCSS: bg-green-500 + text-white</p>
      </div>
      
      {/* 測試圓角 */}
      <div className="bg-gray-200 p-4 rounded-lg">
        <p>標準圓角: rounded-lg</p>
      </div>
    </div>
  )
}
