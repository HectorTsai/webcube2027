import { Context } from 'hono';
import { jsx } from "hono/jsx";
import Cube from '../components/方塊.tsx';
import Card from '../components/Card/index.tsx';

const cubes = [
  { id: "方塊:方塊:avatar", name: "頭像" },
  { id: "方塊:方塊:button", name: "按鈕" },
  { id: "方塊:方塊:span", name: "文字區塊" },
  { id: "方塊:方塊:icon", name: "圖示" },
  { id: "方塊:方塊:image", name: "圖片" },
  { id: "方塊:方塊:divider", name: "分隔線" },
  { id: "方塊:方塊:container", name: "容器" },
  { id: "方塊:方塊:input", name: "輸入框" },
  { id: "方塊:方塊:toggle", name: "切換開關" },
  { id: "方塊:方塊:swap", name: "切換" },
  { id: "方塊:方塊:calendar", name: "日曆" },
  { id: "方塊:方塊:popup", name: "彈出框" },
  { id: "方塊:方塊:footer", name: "頁尾" },
  { id: "方塊:方塊:flex", name: "彈性佈局" },
  { id: "方塊:方塊:grid", name: "網格佈局" },
  { id: "方塊:方塊:input-field", name: "輸入欄位" },
  { id: "方塊:方塊:date-picker", name: "日期選擇器" },
  { id: "方塊:方塊:time-picker", name: "時間選擇器" },
  { id: "方塊:方塊:select", name: "選擇框" },
  { id: "方塊:方塊:option-picker", name: "選項選擇器" },
  { id: "方塊:方塊:card", name: "卡片" },
  { id: "方塊:方塊:hero", name: "英雄區塊" },
  { id: "方塊:方塊:list", name: "列表" },
  { id: "方塊:方塊:menubar", name: "導航列" },
  { id: "方塊:方塊:steps", name: "步驟" },
  { id: "方塊:方塊:timeline", name: "時間軸" },
  { id: "方塊:方塊:book", name: "書籍" },
];

const defaultParameters: Record<string, any> = {
  "方塊:方塊:avatar": {
    icon: "圖示:圖示:使用者",
    size: "md",
    color: "primary",
    variant: "crystal"
  },
  "方塊:方塊:button": {
    children: "按鈕",
    color: "primary",
    variant: "solid",
    size: "md"
  },
  "方塊:方塊:span": {
    children: '{"en":"Text Block","zh-tw":"文字區塊","zh-cn":"文字區塊","ja":"テキストブロック","vi":"Bộ việt"}',
    size: "md"
  },
  "方塊:方塊:icon": {
    id: "圖示:圖示:首頁",
    size: "md"
  },
  "方塊:方塊:image": {
    id: "影像:影像:hono",
    alt: "測試圖片",
    width: "200",
    height: "200"
  },
  "方塊:方塊:divider": {
    color: "neutral",
    position: "center",
    children: "test",
  },
  "方塊:方塊:container": {
    children: "容器內容",
    color: "primary",
    variant: "solid",
    padding: "md",
    direction: "column"
  },
  "方塊:方塊:input": {
    placeholder: "請輸入",
    color: "primary",
    variant: "solid",
    frontLabel: "前缀",
    endLabel: "后缀",
    floatLabel: "浮动标签",
  },
  "方塊:方塊:toggle": {
    size: "md",
    color: "primary"
  },
  "方塊:方塊:swap": {
    fromIcon: "圖示:圖示:登入",
    toIcon: "圖示:圖示:登出",
    size: "md"
  },
  "方塊:方塊:calendar": {
    color: "primary",
    variant: "solid",
    popupState: "calendarPopup"
  },
  "方塊:方塊:popup": {
    state: "showPopup",
    color: "primary",
    variant: "solid"
  },
  "方塊:方塊:footer": {
    color: "primary",
    variant: "solid",
    padding: "lg",
    children: [
      {"type": "span", "attributes": {"class": "text-sm"}, "children": ["© 2024 WebCube. All rights reserved."]}
    ]
  },
  "方塊:方塊:flex": {
    className: "w-full",
    direction: "row",
    gap: "md",
    justify: "start",
    align: "stretch",
    padding: "md",
    color: "primary",
    variant: "solid",
    children: [
      {"type": "div", "attributes": {"class": "bg-primary text-primary-content p-4 rounded flex-1 text-center"}, "children": ["項目 1"]},
      {"type": "div", "attributes": {"class": "bg-primary text-primary-content p-4 rounded flex-1 text-center"}, "children": ["項目 2"]},
      {"type": "div", "attributes": {"class": "bg-primary text-primary-content p-4 rounded flex-1 text-center"}, "children": ["項目 3"]}
    ]
  },
  "方塊:方塊:grid": {
    className: "w-full",
    cols: 3,
    gap: "md",
    justify: "start",
    align: "stretch",
    padding: "md",
    color: "primary",
    variant: "solid",
    children: [
      {"type": "div", "attributes": {"class": "bg-primary text-primary-content p-4 rounded text-center"}, "children": ["1"]},
      {"type": "div", "attributes": {"class": "bg-primary text-primary-content p-4 rounded text-center"}, "children": ["2"]},
      {"type": "div", "attributes": {"class": "bg-primary text-primary-content p-4 rounded text-center"}, "children": ["3"]},
      {"type": "div", "attributes": {"class": "bg-primary text-primary-content p-4 rounded text-center"}, "children": ["4"]},
      {"type": "div", "attributes": {"class": "bg-primary text-primary-content p-4 rounded text-center"}, "children": ["5"]},
      {"type": "div", "attributes": {"class": "bg-primary text-primary-content p-4 rounded text-center"}, "children": ["6"]}
    ]
  },
  "方塊:方塊:input-field": {
    color: "primary",
    variant: "solid",
    children: [
      {"type":"span","attributes":{"class":"fieldLabel"},"children":["前綴"]},
      {"type":"input","attributes":{"class":"fieldInput","placeholder":"請輸入內容"}},
      {"type":"span","attributes":{"class":"fieldLabelEnd"},"children":["後綴"]}
    ]
  },
  "方塊:方塊:date-picker": {
    name: "date",
    size: "md",
    title: "選擇日期",
    color: "primary",
    variant: "solid"
  },
  "方塊:方塊:time-picker": {
    name: "time",
    size: "md",
    title: "選擇時間",
    use24Hour: true,
    color: "primary",
    variant: "solid"
  },
  "方塊:方塊:date-model-input": {
    name: "date",
    label: "日期",
    modalTitle: "選擇日期",
    size: "md",
    color: "primary",
    variant: "solid"
  },
  "方塊:方塊:time-model-input": {
    name: "time",
    label: "時間",
    modalTitle: "選擇時間",
    size: "md",
    color: "primary",
    variant: "solid"
  },
  "方塊:方塊:card": {
    color: "primary",
    variant: "outline",
    direction: "column",
    children: [
      {"方塊ID": "方塊:方塊:card-title", "attributes": {}, "children": ["卡片標題"]},
      {"方塊ID": "方塊:方塊:card-body", "attributes": {}, "children": ["這是卡片內容"]},
      {"方塊ID": "方塊:方塊:card-foot", "attributes": {}, "children": ["卡片底部"]}
    ]
  },
  "方塊:方塊:card-title": {
    className: ""
  },
  "方塊:方塊:card-body": {
    className: ""
  },
  "方塊:方塊:card-foot": {
    className: ""
  },
  "方塊:方塊:hero": {
    color: "primary",
    variant: "solid",
    direction: "column",
    padding: "lg",
    minHeight: "24rem",
    fullScreen: false,
    children: [
      {"方塊ID": "方塊:方塊:hero-title", "attributes": {}, "children": ["歡迎來到 WebCube"]},
      {"方塊ID": "方塊:方塊:hero-subtitle", "attributes": {}, "children": ["快速建構現代化的網頁應用"]},
      {"方塊ID": "方塊:方塊:hero-content", "attributes": {}, "children": ["WebCube 是一個強大的網頁開發框架"]},
      {"方塊ID": "方塊:方塊:hero-actions", "attributes": {}, "children": []}
    ]
  },
  "方塊:方塊:hero-title": {
    className: ""
  },
  "方塊:方塊:hero-subtitle": {
    className: ""
  },
  "方塊:方塊:hero-content": {
    className: ""
  },
  "方塊:方塊:hero-actions": {
    className: ""
  },
  "方塊:方塊:modal": {
    state: "showModal",
    color: "primary",
    variant: "solid",
    width: "480px"
  },
  "方塊:方塊:modal-title": {
    className: ""
  },
  "方塊:方塊:modal-foot": {
    className: ""
  },
  "方塊:方塊:drawer": {
    state: "showDrawer",
    color: "primary",
    variant: "solid",
    width: "320px",
    position: "left"
  },
  "方塊:方塊:drawer-title": {
    className: ""
  },
  "方塊:方塊:drawer-foot": {
    className: ""
  },
  "方塊:方塊:menubar": {
    color: "primary",
    variant: "solid",
    padding: "md",
    responsive: true,
    drawerState: "menuOpen",
    children: [
      {"方塊ID": "方塊:方塊:menubar-head", "attributes": {}, "children": [
        {"type": "span", "attributes": {"class": "font-bold text-xl"}, "children": ["WebCube"]}
      ]},
      {"方塊ID": "方塊:方塊:menubar-item", "attributes": {}, "children": [
        {"方塊ID": "方塊:方塊:link", "attributes": {"href": "/"}, "children": ["首頁"]}
      ]},
      {"方塊ID": "方塊:方塊:menubar-item", "attributes": {}, "children": [
        {"方塊ID": "方塊:方塊:link", "attributes": {"href": "/about"}, "children": ["關於"]}
      ]},
      {"方塊ID": "方塊:方塊:menubar-item", "attributes": {}, "children": [
        {"方塊ID": "方塊:方塊:link", "attributes": {"href": "/services"}, "children": ["服務"]}
      ]},
      {"方塊ID": "方塊:方塊:menubar-item", "attributes": {}, "children": [
        {"方塊ID": "方塊:方塊:link", "attributes": {"href": "/products"}, "children": ["產品"]}
      ]},
      {"方塊ID": "方塊:方塊:menubar-item", "attributes": {}, "children": [
        {"方塊ID": "方塊:方塊:link", "attributes": {"href": "/contact"}, "children": ["聯繫"]}
      ]},
      {"方塊ID": "方塊:方塊:menubar-foot", "attributes": {}, "children": [
        {"方塊ID": "方塊:方塊:button", "attributes": {"variant": "solid", "size": "sm"}, "children": ["登入"]}
      ]}
    ]
  },
  "方塊:方塊:menubar-head": {},
  "方塊:方塊:menubar-item": {},
  "方塊:方塊:menubar-foot": {},
  "方塊:方塊:select": {
    name: "select",
    placeholder: "請選擇",
    color: "primary",
    variant: "solid",
    children: [
      {"方塊ID": "方塊:方塊:select-option", "attributes": {"value": "option1"}, "children": ["選項 1"]},
      {"方塊ID": "方塊:方塊:select-option", "attributes": {"value": "option2"}, "children": ["選項 2"]},
      {"方塊ID": "方塊:方塊:select-option", "attributes": {"value": "option3"}, "children": ["選項 3"]}
    ]
  },
  "方塊:方塊:list": {
    color: "primary",
    variant: "solid",
    padding: "md",
    children: [
      {"方塊ID": "方塊:方塊:list-title", "attributes": {}, "children": ["列表標題"]},
      {"方塊ID": "方塊:方塊:list-row", "attributes": {}, "children": ["列表項目 1"]},
      {"方塊ID": "方塊:方塊:list-row", "attributes": {}, "children": ["列表項目 2"]},
      {"方塊ID": "方塊:方塊:list-row", "attributes": {}, "children": ["列表項目 3"]}
    ]
  },
  "方塊:方塊:list-row": {
    color: "primary",
    variant: "solid",
    padding: "md"
  },
  "方塊:方塊:list-title": {
    className: ""
  },
  "方塊:方塊:steps": {
    color: "primary",
    variant: "solid",
    className:"w-full",
    children: [
      {"方塊ID": "方塊:方塊:step", "attributes": {"completed": true}, "children": ["步驟 1"]},
      {"方塊ID": "方塊:方塊:step", "attributes": {"completed": true}, "children": ["步驟 2"]},
      {"方塊ID": "方塊:方塊:step", "attributes": {}, "children": ["步驟 3"]}
    ]
  },
  "方塊:方塊:step": {
    label: "步驟",
    color: "primary",
    variant: "solid"
  },
  "方塊:方塊:timeline": {
    color: "primary",
    variant: "solid",
    className:"w-full",
    children: [
      {"方塊ID": "方塊:方塊:timeline-item", "attributes": {"start": "1984", "end": "First Macintosh computer", "color": "primary"}, "children": []},
      {"方塊ID": "方塊:方塊:timeline-item", "attributes": {"start": "1998", "end": "iMac", "color": "secondary"}, "children": []},
      {"方塊ID": "方塊:方塊:timeline-item", "attributes": {"start": "2001", "end": "iPod", "color": "accent"}, "children": []}
    ]
  },
  "方塊:方塊:timeline-item": {
    color: "primary",
    variant: "solid",
    start: "時間",
    end: "事件"
  },
  "方塊:方塊:option-picker": {
    color: "primary",
    variant: "solid",
    mode: "single",
    name: "option",
    children: [
      {"方塊ID": "方塊:方塊:option-item", "attributes": {"value": "small"}, "children": ["小"]},
      {"方塊ID": "方塊:方塊:option-item", "attributes": {"value": "medium"}, "children": ["中"]},
      {"方塊ID": "方塊:方塊:option-item", "attributes": {"value": "large"}, "children": ["大"]}
    ]
  },
  "方塊:方塊:book": {
    color: "primary",
    variant: "solid",
    children: [
      {"方塊ID": "方塊:方塊:book-cover", "attributes": {}, "children": ["書籍封面"]},
      {"方塊ID": "方塊:方塊:book-page", "attributes": {}, "children": ["第一頁內容"]},
      {"方塊ID": "方塊:方塊:book-page", "attributes": {}, "children": ["第二頁內容"]},
      {"方塊ID": "方塊:方塊:book-foot", "attributes": {}, "children": ["書籍底部"]}
    ]
  },
  "方塊:方塊:book-cover": {
    color: "primary",
    variant: "solid"
  },
  "方塊:方塊:book-page": {
    color: "primary",
    variant: "solid"
  },
  "方塊:方塊:book-foot": {
    color: "primary",
    variant: "solid"
  },
  "方塊:方塊:basic-layout": {
    color: "primary",
    variant: "solid"
  },
  "方塊:方塊:tags": {
    color: "primary",
    variant: "solid",
    size: "md"
  }
};

export default async function CubeTestPage(ctx: Context) {
  const url = new URL(ctx.req.url);
  const cubeId = url.searchParams.get('id') || '方塊:方塊:avatar';
  const paramsStr = url.searchParams.get('params') || '{}';
  
  let params: any = {};
  try {
    params = JSON.parse(paramsStr);
  } catch (e) {
    params = {};
  }

  let cubeResult = null;
  let error = null;

  try {
    cubeResult = jsx(Cube as any, { from: cubeId, args: params, context: ctx, depth: 0 } as any);
  } catch (e: any) {
    error = e.message;
  }

  return (
    <div 
      class="p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen"
      x-data={`{
        selectedCube: '${cubeId}',
        paramsStr: ${JSON.stringify(JSON.stringify(params))},
        cubes: ${JSON.stringify(cubes)},
        defaultParamsStr: ${JSON.stringify(JSON.stringify(defaultParameters))},
        get params() {
          return JSON.parse(this.paramsStr);
        },
        set params(val) {
          this.paramsStr = JSON.stringify(val);
        },
        updateParams() {
          const defaultParams = JSON.parse(this.defaultParamsStr);
          const defaults = defaultParams[this.selectedCube] || {};
          this.paramsStr = JSON.stringify(defaults);
          this.updateTextarea();
        },
        updateTextarea() {
          document.getElementById('paramsTextarea').value = this.paramsStr;
        },
        submitForm() {
          const textarea = document.getElementById('paramsTextarea');
          const paramsInput = document.getElementById('paramsInput');
          paramsInput.value = textarea.value;
          document.getElementById('cubeForm').submit();
        }
      }`}
      x-init="Alpine.store('drawers', { menuOpen: false, menuOpen1: false, menuOpen2: false, menuOpen3: false }); updateTextarea()"
    >
      <h1 class="text-3xl font-bold mb-6 text-center">動態方塊測試器</h1>
      <a href="/test" class="text-primary hover:underline mb-4 inline-block">← 返回測試首頁</a>

      <Card className="mb-6" padding="xs" variant="outline">
        <h2 class="text-xl font-semibold mb-4">測試參數</h2>
        <form id="cubeForm" action="/test/cube" method="get" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">方塊ID</label>
            <select 
              name="id"
              x-model="selectedCube"
              x-on:change="updateParams()"
              class="w-full p-2 border border-gray-300 rounded"
            >
              {cubes.map(cube => (
                <option value={cube.id} selected={cube.id === cubeId}>
                  {cube.name} ({cube.id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">參數 (JSON)</label>
            <textarea 
              id="paramsTextarea"
              class="w-full p-2 border border-gray-300 rounded h-32 font-mono"
              placeholder='{"size": "md", "color": "primary"}'
            ></textarea>
            <input type="hidden" name="params" id="paramsInput" value={paramsStr} />
          </div>
          <div class="flex gap-2">
            <button type="button" x-on:click="submitForm()" class="btn btn-primary">
              測試方塊
            </button>
            <button type="button" x-on:click="updateParams()" class="btn btn-outline">
              重置預設參數
            </button>
          </div>
        </form>
      </Card>

      <Card className="mb-6" padding="xs" variant="outline" color="success">
        <h2 class="text-xl font-semibold">渲染結果</h2>
        {error ? (
          <div class="bg-error text-error-content rounded">
            <p class="font-bold">錯誤:</p>
            <p class="font-mono text-sm mt-2">{error}</p>
          </div>
        ) : (
          <div class="space-y-4">
            <div>
              <h3 class="font-semibold mb-2">動態渲染結果:</h3>
              <div class="bg-base-200 rounded min-h-[100px] flex items-center justify-center">
                {cubeResult}
              </div>
            </div>
          </div>
        )}
      </Card>
      <Card className="mb-6" padding="xs" variant="outline" color="info">
        <h2 class="text-xl font-semibold mb-4">方塊資訊</h2>
        <div class="bg-base-200 p-4 rounded">
          <p class="font-mono text-sm">
            <strong>方塊ID:</strong> {cubeId}
          </p>
          <p class="font-mono text-sm mt-2">
            <strong>參數:</strong> {JSON.stringify(params, null, 2)}
          </p>
        </div>
      </Card>
    </div>
  );
}
