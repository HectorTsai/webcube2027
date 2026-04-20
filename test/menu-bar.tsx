import MenuBar, { MenuItem } from '../components/MenuBar/index.tsx';
import Button from '../components/Button/index.tsx';

export default async function MenuBarTest() {
  return (
    <div x-data x-init={`Alpine.store('drawers', { menuOpen1: false, menuOpen2: false, menuOpen3: false, menuOpen4: false, menuOpen5: false, menuOpen6: false, menuOpen7: false })`} class="container mx-auto p-8">
      <h1 class="text-3xl font-bold mb-8">MenuBar 測試頁面</h1>
      
      <div class="space-y-8">
        {/* 基本使用 - 使用 MenuItem */}
        <div>
          <h2 class="text-xl font-semibold mb-4">基本使用 - 使用 MenuItem</h2>
          <MenuBar responsive drawerState="menuOpen1" color="info">
            <MenuItem>
              <a href="/" class="btn btn-info w-full">首頁</a>
            </MenuItem>
            <MenuItem>
              <a href="/about" class="btn btn-info w-full">關於我們</a>
            </MenuItem>
            <MenuItem>
              <a href="/services" class="btn btn-info w-full">服務</a>
            </MenuItem>
            <MenuItem>
              <a href="/contact" class="btn btn-info w-full">聯繫我們</a>
            </MenuItem>
          </MenuBar>
        </div>
        
        {/* 不同變體 */}
        <div>
          <h2 class="text-xl font-semibold mb-4">不同變體</h2>
          <div class="space-y-4">
            <MenuBar variant="solid" color="warning" responsive drawerState="menuOpen2">
              <MenuItem>
                <a href="/" class="btn btn-warning w-full">選項 1</a>
              </MenuItem>
              <MenuItem>
                <a href="/" class="btn btn-warning w-full">選項 2</a>
              </MenuItem>
            </MenuBar>
            <MenuBar variant="outline" color="secondary" responsive drawerState="menuOpen3">
              <MenuItem>
                <Button variant="outline" color="secondary" className="w-full">選項 1</Button>
              </MenuItem>
              <MenuItem>
                <Button variant="outline" color="secondary" className="w-full">選項 2</Button>
              </MenuItem>
            </MenuBar>
            <MenuBar variant="crystal" color="accent" responsive drawerState="menuOpen4">
              <MenuItem>
                <Button variant="crystal" color="accent" className="w-full">選項 1</Button>
              </MenuItem>
              <MenuItem>
                <Button variant="crystal" color="accent" className="w-full">選項 2</Button>
              </MenuItem>
            </MenuBar>
          </div>
        </div>
        
        {/* 固定在頂部 */}
        <div>
          <h2 class="text-xl font-semibold mb-4">固定在頂部</h2>
          <p class="mb-4 text-gray-600">此 MenuBar 已固定在頁面頂部，請向下滾動查看效果</p>
          <MenuBar 
            sticky 
            variant="solid" 
            color="primary" 
            shadow="lg"
            logo={<div class="font-bold text-lg">固定頂部 MenuBar</div>}
            responsive 
            drawerState="menuOpen5"
          >
            <MenuItem>
              <a href="/" class="btn btn-primary w-full">首頁</a>
            </MenuItem>
            <MenuItem>
              <a href="/about" class="btn btn-primary w-full">關於我們</a>
            </MenuItem>
            <MenuItem>
              <a href="/services" class="btn btn-primary w-full">服務</a>
            </MenuItem>
            <MenuItem>
              <a href="/contact" class="btn btn-primary w-full">聯繫我們</a>
            </MenuItem>
        </MenuBar>
        </div>
        
        {/* 帶有 Logo 和 Footer */}
        <div>
          <h2 class="text-xl font-semibold mb-4">帶有 Logo 和 Footer</h2>
          <MenuBar 
            variant="solid" 
            color="success"
            logo={<div class="font-bold text-xl">MyApp</div>}
            footer={
              <Button variant="solid" color="success">開始使用</Button>
            }
            responsive 
            drawerState="menuOpen6"
          >
            <MenuItem>
              <a href="/" class="btn btn-success w-full">功能</a>
            </MenuItem>
            <MenuItem>
              <a href="/" class="btn btn-success w-full">文件</a>
            </MenuItem>
          </MenuBar>
        </div>
        
        {/* 響應式 MenuBar（結合 Drawer） */}
        <div>
          <h2 class="text-xl font-semibold mb-4">響應式 MenuBar（結合 Drawer）</h2>
          <p class="mb-4 text-gray-600">在移動設備上會自動切換為 Drawer 菜單</p>
          <MenuBar 
            sticky 
            responsive 
            variant="solid" 
            color="primary" 
            shadow="lg"
            logo={<div class="font-bold text-lg">WebCube</div>}
            footer={
              <Button variant="solid" color="primary" className="w-full">登錄</Button>
            }
            drawerState="menuOpen7"
          >
            <MenuItem>
              <a href="/" class="btn btn-primary w-full">首頁</a>
            </MenuItem>
            <MenuItem>
              <a href="/about" class="btn btn-primary w-full">關於我們</a>
            </MenuItem>
            <MenuItem>
              <a href="/services" class="btn btn-primary w-full">服務</a>
            </MenuItem>
            <MenuItem>
              <a href="/products" class="btn btn-primary w-full">產品</a>
            </MenuItem>
            <MenuItem>
              <a href="/contact" class="btn btn-primary w-full">聯繫我們</a>
            </MenuItem>
          </MenuBar>
        </div>
      </div>
    </div>
  );
}
