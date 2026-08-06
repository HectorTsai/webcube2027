// data-gateway 頁面 Alpine 元件註冊檔
//
// 由 route-loader 靜態服務於 /static/app.js，_layout.tsx 以 alpineScripts('/static/app.js')
// 引入。載入順序：本檔（defer、在前）→ Alpine runtime（defer、在後），
// 故以 document.addEventListener('alpine:init', …) 在 Alpine 啟動前註冊元件。
//
// 注意：本檔為外部 JS，其中的 class 不會被 UnoCSS 掃描。因此動態 badge 變體
// （badge-success / badge-error / badge-warning 等）皆屬 COMPONENT_CSS 既有
// 元件類，HTML 端元素以靜態 class="badge badge-soft" 為基底、
// x-bind:class 只綁變體，避免合併殘留衝突。

// 共用 /api/health 請求：同批並發（navbar + 首頁各區塊）只發一次；
// settled 後釋放，讓稍後開啟 modal 時能取得新資料。
let healthPromise = null;
function getHealth() {
  if (!healthPromise) {
    healthPromise = fetch('/api/health')
      .then((r) => r.json())
      .finally(() => {
        healthPromise = null;
      });
  }
  return healthPromise;
}

/** L3 狀態字串 → badge 變體 + 顯示文字（✓/✗ 判斷，未設定為警告） */
function l3Badge(value) {
  const s = String(value || '未設定');
  const cls = s.includes('✓')
    ? 'badge-success'
    : s.includes('✗')
    ? 'badge-error'
    : 'badge-warning';
  return { cls, text: s };
}

document.addEventListener('alpine:init', () => {
  // ── navbar 服務狀態 badge（Layout 共用，各頁皆出現）──
  Alpine.data('statusBadge', () => ({
    badgeClass: 'badge-warning',
    badgeText: '檢查中…',
    async check() {
      try {
        const r = await getHealth();
        if (r.status === 'ok') {
          this.badgeText = '正常運作';
          this.badgeClass = 'badge-success';
        } else {
          this.badgeText = '異常';
          this.badgeClass = 'badge-error';
        }
      } catch {
        this.badgeText = '無法連線';
        this.badgeClass = 'badge-error';
      }
    },
  }));

  // ── 首頁 L1/L2/L3 資料庫狀態 ──
  Alpine.data('dbStatus', () => ({
    l1: { text: '檢查中…', cls: 'badge-warning' },
    l2: { text: '檢查中…', cls: 'badge-warning' },
    l3: { text: '檢查中…', cls: 'badge-warning' },
    async check() {
      try {
        const r = await getHealth();
        const setDb = (name, connected) => {
          this[name] = {
            text: connected ? '已連線' : '未連線',
            cls: connected ? 'badge-success' : 'badge-error',
          };
        };
        setDb('l1', r.l1 === 'connected');
        setDb('l2', r.l2 === 'connected');
        this.l3 = l3Badge(r.l3);
      } catch {
        for (const k of ['l1', 'l2', 'l3']) {
          this[k] = { text: '無法連線', cls: 'badge-error' };
        }
      }
    },
  }));

  // ── 首頁連線池狀態卡 ──
  Alpine.data('poolStatus', () => ({
    loading: true,
    error: '',
    pool: null,
    async check() {
      try {
        const r = await getHealth();
        this.pool = r.pool && r.pool.status ? r.pool : null;
      } catch {
        this.error = '無法取得連線池狀態';
      } finally {
        this.loading = false;
      }
    },
    hitRate() {
      return ((this.pool.status.hitRate || 0) * 100).toFixed(1) + '%';
    },
    // 顯示格式（剩餘倒數 / ∞）由共用 /pool-status.js 的 PoolStatus 統一提供
    remainFmt(ms) {
      return PoolStatus.remainFmt(ms);
    },
    itemMeta(it) {
      return PoolStatus.itemMeta(it);
    },
  }));

  // ── 系統健康狀態 modal（原生 <dialog> + showModal）──
  Alpine.data('healthModal', () => ({
    loading: true,
    error: '',
    data: null,
    open() {
      this.loading = true;
      this.error = '';
      this.data = null;
      this.$refs.modal.showModal();
      getHealth()
        .then((d) => {
          this.data = d;
        })
        .catch(() => {
          this.error = '無法連線至伺服器';
        })
        .finally(() => {
          this.loading = false;
        });
    },
    get l3Cls() {
      return l3Badge(this.data && this.data.l3).cls;
    },
    get l3Text() {
      return l3Badge(this.data && this.data.l3).text;
    },
  }));
});
