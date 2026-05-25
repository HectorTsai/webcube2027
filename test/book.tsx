import Book, { Cover, Page, Foot } from "../components/Book/index.tsx";

export default function BookTest() {
  return (
    <Book>
      <Cover title="網站申請書" icon="圖示:圖示:web_cube" variant="crystal" color="primary">
        <p class="text-lg">WebCube 2027 專案申請書</p>
      </Cover>
      
      <Page>
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">第一章：專案概述</h2>
          <p class="text-lg">
            本專案旨在建立一個現代化的網站申請系統，提供直觀的用戶界面和強大的後台管理功能。
          </p>
          <p class="text-lg">
            系統將採用最新的前端技術和響應式設計，確保在不同設備上都能提供優質的用戶體驗。
          </p>
        </div>
      </Page>
      
      <Page>
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">第二章：技術架構</h2>
          <ul class="list-disc list-inside space-y-2">
            <li>前端框架：React + TypeScript</li>
            <li>樣式系統：UnoCSS</li>
            <li>動畫庫：Framer Motion</li>
            <li>後端服務：Node.js + Express</li>
            <li>資料庫：MongoDB</li>
          </ul>
        </div>
      </Page>
      
      <Page color="warning">
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">第三章：功能特色</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-base-200 rounded-lg">
              <h3 class="font-semibold">響應式設計</h3>
              <p>支援桌面、平板、手機等多種設備</p>
            </div>
            <div class="p-4 bg-base-200 rounded-lg">
              <h3 class="font-semibold">無障礙訪問</h3>
              <p>符合 WCAG 2.1 AA 標準</p>
            </div>
            <div class="p-4 bg-base-200 rounded-lg">
              <h3 class="font-semibold">多語言支援</h3>
              <p>支援繁體中文、簡體中文、英文</p>
            </div>
            <div class="p-4 bg-base-200 rounded-lg">
              <h3 class="font-semibold">SEO 優化</h3>
              <p>完善的搜索引擎優化策略</p>
            </div>
          </div>
        </div>
      </Page>
      
      <Page color="secondary">
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">第三章：功能特色</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-base-200 rounded-lg">
              <h3 class="font-semibold">響應式設計</h3>
              <p>支援桌面、平板、手機等多種設備</p>
            </div>
            <div class="p-4 bg-base-200 rounded-lg">
              <h3 class="font-semibold">無障礙訪問</h3>
              <p>符合 WCAG 2.1 AA 標準</p>
            </div>
            <div class="p-4 bg-base-200 rounded-lg">
              <h3 class="font-semibold">多語言支援</h3>
              <p>支援繁體中文、簡體中文、英文</p>
            </div>
            <div class="p-4 bg-base-200 rounded-lg">
              <h3 class="font-semibold">SEO 優化</h3>
              <p>完善的搜索引擎優化策略</p>
            </div>
          </div>
        </div>
      </Page>
      <Foot copyright="DUI co., Ltd." publisher="WebCube 2027">
        <p class="text-lg">感謝您閱讀本申請書</p>
        <p class="text-sm">如有任何問題，請聯繫我們</p>
      </Foot>
    </Book>
  );
}