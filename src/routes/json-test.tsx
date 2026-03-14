export default async function JSON佈局測試頁面(ctx: any) {
  return (
    <div>
      <h1>JSON 佈局測試</h1>
      <p>這是一個測試頁面，用於驗證 JSON 驅動的佈局系統。</p>
      <div className="webcube-卡片">
        <h2>測試內容</h2>
        <p>如果你看到這個內容被正確包裝在佈局中，表示 JSON 佈局系統運作正常！</p>
        <ul>
          <li>檢查導航欄是否顯示</li>
          <li>檢查主內容區域</li>
          <li>檢查頁尾是否顯示</li>
          <li>檢查 CSS Variables 是否正確應用</li>
        </ul>
      </div>
    </div>
  )
}
