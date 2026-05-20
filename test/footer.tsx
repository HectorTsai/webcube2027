import Footer from '../components/Footer.tsx';

export default function FooterTest() {
  return (
    <div class="container mx-auto p-8">
      <h1 class="text-3xl font-bold mb-8">Footer 測試頁面</h1>
      
      <div class="space-y-8">
        {/* 基本使用 */}
        <div>
          <h2 class="text-xl font-semibold mb-4">基本使用</h2>
          <Footer>
            <div class="text-center">
              <div>© 2024 WebCube. All rights reserved.</div> 
            </div>
          </Footer>
        </div>
        
        {/* 不同變體 */}
        <div>
          <h2 class="text-xl font-semibold mb-4">不同變體</h2>
          <div class="space-y-4">
            <Footer variant="solid" color="primary">
              <div class="text-center">Solid Footer</div>
            </Footer>
            <Footer variant="outline" color="secondary">
              <div class="text-center">Outline Footer</div>
            </Footer>
            <Footer variant="ghost" color="accent">
              <div class="text-center">Ghost Footer</div>
            </Footer>
            <Footer variant="gradient-down" color="info">
              <div class="text-center">Gradient Footer</div>
            </Footer>
          </div>
        </div>
        
        {/* 自定義內容 */}
        <div>
          <h2 class="text-xl font-semibold mb-4">自定義內容</h2>
          <Footer 
            variant="gradient-down" 
            color="primary" 
            padding="xl"
            className="mt-4"
          >
            <div class="grid grid-cols-3 gap-8 w-full max-w-6xl">
              <div>
                <h3 class="font-bold text-lg mb-4">關於我們</h3>
                <ul class="space-y-2">
                  <li><a href="#" class="hover:underline">首頁</a></li>
                  <li><a href="#" class="hover:underline">關於我們</a></li>
                  <li><a href="#" class="hover:underline">聯繫我們</a></li>
                </ul>
              </div>
              <div>
                <h3 class="font-bold text-lg mb-4">服務</h3>
                <ul class="space-y-2">
                  <li><a href="#" class="hover:underline">網站設計</a></li>
                  <li><a href="#" class="hover:underline">應用開發</a></li>
                  <li><a href="#" class="hover:underline">數字行銷</a></li>
                </ul>
              </div>
              <div>
                <h3 class="font-bold text-lg mb-4">聯繫方式</h3>
                <ul class="space-y-2">
                  <li>Email: contact@webcube.com</li>
                  <li>電話: +886 123 4567</li>
                  <li>地址: 台北市中正區</li>
                </ul>
              </div>
            </div>
            <div class="mt-8 text-center text-sm text-gray-500 w-full">
              © 2024 WebCube. All rights reserved.
            </div>
          </Footer>
        </div>
        
        {/* 不同尺寸和樣式 */}
        <div>
          <h2 class="text-xl font-semibold mb-4">不同尺寸和樣式</h2>
          <div class="space-y-4">
            <Footer padding="sm" color="success">
              <div class="text-center">Small Padding Footer</div>
            </Footer>
            <Footer padding="2xl" color="warning">
              <div class="text-center">Large Padding Footer</div>
            </Footer>
            <Footer rounded="lg" shadow="lg" color="error">
              <div class="text-center">Rounded with Shadow Footer</div>
            </Footer>
          </div>
        </div>
        
        {/* 固定在底部 */}
        <div>
          <h2 class="text-xl font-semibold mb-4">固定在底部</h2>
          <p class="mb-4 text-gray-600">此 Footer 已固定在頁面底部，請向下滾動查看效果</p>
          <Footer 
            sticky 
            variant="solid" 
            color="primary" 
            shadow="lg"
          >
            <div class="text-center">
              <div>固定在底部的 Footer - © 2024 WebCube</div>
            </div>
          </Footer>
        </div>
      </div>
    </div>
  );
}
