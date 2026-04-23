import Book, { Cover, Page, Foot } from "../components/Book/index.tsx";

// 簡單的 SVG 圖示
const sampleSVG = `
<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="24" y="24" width="80" height="80" rx="8" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="2"/>
  <path d="M48 48H80V80H48V48Z" fill="currentColor" fill-opacity="0.4"/>
  <path d="M56 56H72V72H56V56Z" fill="currentColor" fill-opacity="0.6"/>
  <circle cx="64" cy="64" r="16" fill="currentColor" fill-opacity="0.8"/>
</svg>
`;

export default function BookTest() {
  return (
    <Book color="primary" variant="solid" width="full" height="full">
      <Cover title="網站申請書" svg={sampleSVG}>
        <p class="text-lg mt-4">WebCube 2027 專案申請書</p>
      </Cover>
      
      <Page pageNumber={1} odd={true}>
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
      
      <Page pageNumber={2} odd={false}>
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
      
      <Page pageNumber={3} odd={true}>
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
      
      <Page pageNumber={4} odd={false}>
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
        <p class="text-lg mb-4 pt-24">感謝您閱讀本申請書</p>
        <p class="text-sm">如有任何問題，請聯繫我們</p>
      </Foot>
    </Book>
  );
}