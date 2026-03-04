export default function SetupPage() {
  console.log("SetupPage rendered");
  return (
    <div>
      <h1>系統設定</h1>
      <form action="/api/setup" method="POST">
        <div>
          <label>資料庫 URL</label>
          <input type="text" name="dbUrl" required />
        </div>
        <div>
          <label>使用者</label>
          <input type="text" name="dbUser" />
        </div>
        <div>
          <label>密碼</label>
          <input type="password" name="dbPassword" required />
        </div>
        <div>
          <label>命名空間</label>
          <input type="text" name="dbNamespace" defaultValue="webcube" />
        </div>
        <div>
          <label>資料庫名稱</label>
          <input type="text" name="dbDatabase" defaultValue="webcube" />
        </div>
        <button type="submit">儲存設定</button>
      </form>
    </div>
  );
}
