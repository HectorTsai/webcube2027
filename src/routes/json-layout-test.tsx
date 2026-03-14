export default async function JSON佈局測試頁面(ctx: any) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">JSON 佈局測試</h1>
      <div className="space-y-4">
        <div className="webcube-卡片">
          <h2 className="text-xl font-semibold mb-2">測試內容</h2>
          <p className="mb-4">這是一個測試頁面，用於驗證 JSON 驅動的佈局系統。</p>
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-blue-800">
              <strong>檢查項目：</strong>
            </p>
            <ul className="list-disc list-inside text-blue-700 mt-2">
              <li>導航欄是否顯示</li>
              <li>主內容區域是否正確</li>
              <li>頁尾是否顯示</li>
              <li>CSS Variables 是否正確應用</li>
              <li>插槽機制是否正常工作</li>
            </ul>
          </div>
        </div>
        
        <div className="webcube-卡片">
          <h2 className="text-xl font-semibold mb-2">技術驗證</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h3 className="text-green-800 font-semibold">✅ 預期行為</h3>
              <ul className="text-green-700 mt-2 text-sm">
                <li>JSON API 回傳正確配置</li>
                <li>渲染器正確解析 JSON</li>
                <li>插槽內容正確插入</li>
                <li>樣式正確應用</li>
              </ul>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h3 className="text-yellow-800 font-semibold">🔧 除錯資訊</h3>
              <p className="text-yellow-700 text-sm mt-2">
                檢查瀏覽器開發者工具的 Console 和 Network 標籤，
                查看 API 請求和渲染錯誤。
              </p>
            </div>
          </div>
        </div>
        
        <div className="webcube-卡片">
          <h2 className="text-xl font-semibold mb-2">下一步</h2>
          <p className="text-gray-600">
            如果這個測試成功，我們就可以：
          </p>
          <ol className="list-decimal list-inside text-gray-600 mt-2">
            <li>擴展支援更多佈局類型</li>
            <li>整合 AI 生成佈局</li>
            <li>加入動態主題切換</li>
            <li>實作佈局編輯器</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
