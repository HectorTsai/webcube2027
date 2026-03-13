// WebCube2027 熱加載客戶端
(function() {
  'use strict';
  
  console.log('🔥 啟動熱加載客戶端...');
  
  // 建立 WebSocket 連接
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/hot-reload`;
  
  let socket;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  
  function connect() {
    try {
      socket = new WebSocket(wsUrl);
      
      socket.onopen = function() {
        console.log('🔥 熱加載已連接');
        reconnectAttempts = 0;
      };
      
      socket.onmessage = function(event) {
        const message = event.data;
        console.log('🔥 收到訊息:', message);
        
        // 處理不同類型的熱加載訊息
        if (message.startsWith('reload:')) {
          const filePath = message.replace('reload:', '');
          console.log(`📝 檔案變更: ${filePath}`);
          
          // 如果是 CSS 檔案，只重新載入 CSS
          if (filePath.endsWith('.css')) {
            reloadCSS();
          } else if (filePath.includes('/components/')) {
            // 元件檔案變更，重新載入頁面
            console.log('🔄 元件已更新，重新載入頁面');
            reloadPage();
          } else {
            // 其他檔案變更，重新載入頁面
            reloadPage();
          }
        } else if (message === 'css:updated') {
          console.log('🎨 CSS 已更新');
          reloadCSS();
        } else if (message === 'routes:updated') {
          console.log('🔄 路由已更新');
          reloadPage();
        } else if (message === 'components:updated') {
          console.log('🧩 元件已更新');
          reloadPage();
        } else if (message.includes('熱加載已啟動')) {
          console.log('✅', message);
        }
      };
      
      socket.onclose = function() {
        console.log('🔥 熱加載連接已斷開');
        reconnect();
      };
      
      socket.onerror = function(error) {
        console.error('🔥 熱加載錯誤:', error);
      };
      
    } catch (error) {
      console.error('🔥 無法建立熱加載連接:', error);
    }
  }
  
  function reconnect() {
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      console.log(`🔄 嘗試重新連接 (${reconnectAttempts}/${maxReconnectAttempts})...`);
      setTimeout(connect, 1000);
    } else {
      console.error('🔥 熱加載重新連接失敗，請重新整理頁面');
    }
  }
  
  function reloadCSS() {
    // 重新載入所有 CSS 檔案
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.includes('uno.css')) {
        // 強制重新載入 CSS
        const newHref = href.split('?')[0] + '?t=' + Date.now();
        link.setAttribute('href', newHref);
      }
    });
    
    // 特別處理 UnoCSS
    const unoLink = document.querySelector('link[href*="uno.css"]');
    if (unoLink) {
      const unoHref = unoLink.getAttribute('href');
      const newUnoHref = unoHref.split('?')[0] + '?t=' + Date.now();
      unoLink.setAttribute('href', newUnoHref);
    }
  }
  
  function reloadPage() {
    console.log('🔄 重新載入頁面...');
    
    // 如果支援 HMR，可以嘗試保留狀態
    if (window.location.hash) {
      // 保留錨點
      window.location.reload();
    } else {
      // 普通重新載入
      window.location.reload();
    }
  }
  
  // 啟動連接
  connect();
  
  // 頁面卸載時關閉連接
  window.addEventListener('beforeunload', function() {
    if (socket) {
      socket.close();
    }
  });
  
})();
