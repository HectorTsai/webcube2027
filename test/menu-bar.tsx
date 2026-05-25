import MenuBar, { Head, Foot, Item } from '../components/MenuBar/index.tsx';
import Button from '../components/Button.tsx';
import Link from '../components/Link.tsx';
import Icon from "../components/Icon.tsx";

export default async function MenuBarTest() {
  return (
    <div x-data x-init="Alpine.store('drawers', { menuOpen1: false, menuOpen2: false, menuOpen3: false })" class="container mx-auto p-8">
      <h1 class="text-3xl font-bold mb-8">MenuBar 測試頁面</h1>
      
      <div class="space-y-8">
        {/* 基本使用 */}
        <div>
          <h2 class="text-xl font-semibold mb-4">基本使用</h2>
          <MenuBar responsive drawerState="menuOpen1" color="success">
            <Head>
              <Icon id="圖示:圖示:web_cube" size="xl" />
              <span class="font-bold text-xl">Webcube</span>
            </Head>
            <Item>
              <Link href="/">首頁2</Link>
            </Item>
            <Item>
              <Link href="/about">關於我們</Link>
            </Item>
            <Item>
              <Link href="/services">服務</Link>
            </Item>
            <Foot>
              <Button variant="solid">登入</Button>
            </Foot>
          </MenuBar>
        </div>
        
        {/* 不同顏色 */}
        <div>
          <h2 class="text-xl font-semibold mb-4">不同顏色</h2>
          <div class="space-y-4">
            <MenuBar responsive drawerState="menuOpen2" color="secondary">
              <Head><span class="font-bold">Secondary</span></Head>
              <Item><Link href="/">選項 1</Link></Item>
              <Item><Link href="/">選項 2</Link></Item>
              <Foot><Button variant="solid" color="secondary" size="xs">按鈕</Button></Foot>
            </MenuBar>
            <MenuBar responsive drawerState="menuOpen3" color="accent">
              <Head><span class="font-bold">Accent</span></Head>
              <Item><Link href="/">選項 1</Link></Item>
              <Item><Link href="/">選項 2</Link></Item>
              <Foot><Button variant="solid" color="accent" size="xs">按鈕</Button></Foot>
            </MenuBar>
          </div>
        </div>
        
        {/* 固定在頂部 + 響應式 */}
        <div>
          <h2 class="text-xl font-semibold mb-4">固定在頂部 + 響應式</h2>
          <p class="mb-4 text-gray-600">在移動設備上會顯示 Drawer 圖標，點擊可開啟選單</p>
          <MenuBar 
            sticky 
            responsive 
            drawerState="menuOpen4"
            color="primary"
          >
            <Head>
              <span class="font-bold text-lg">WebCube</span>
            </Head>
            <Item>
              <Link href="/">首頁</Link>
            </Item>
            <Item>
              <Link href="/about">關於我們</Link>
            </Item>
            <Item>
              <Link href="/services">服務</Link>
            </Item>
            <Foot>
              <Button variant="solid" color="primary">登入</Button>
            </Foot>
          </MenuBar>
        </div>
      </div>
    </div>
  );
}