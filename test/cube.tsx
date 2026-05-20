import { Context } from 'hono';
import 動態方塊JSX解析器 from '../services/pageService/動態方塊JSX解析器.ts';
import Card from '../components/Card/index.tsx';
import InputField from '../components/InputField.tsx';

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
  { id: "方塊:方塊:tags", name: "標籤" },
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
    color: "primary",
    label: "切換開關"
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
    padding: "lg"
  },
  "方塊:方塊:flex": {
    direction: "row",
    gap: "md",
    justify: "start",
    align: "stretch",
    padding: "md",
    color: "primary",
    variant: "solid"
  },
  "方塊:方塊:grid": {
    cols: 3,
    gap: "md",
    justify: "start",
    align: "stretch",
    padding: "md"
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
    variant: "solid",
    direction: "column",
    padding: "md"
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
    fullScreen: false
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
    padding: "md"
  },
  "方塊:方塊:menu-item": {
    color: "primary",
    variant: "solid"
  },
  "方塊:方塊:select": {
    name: "select",
    placeholder: "請選擇",
    color: "primary",
    variant: "solid"
  },
  "方塊:方塊:select-option": {
    value: "option",
    label: "選項"
  },
  "方塊:方塊:list": {
    color: "primary",
    variant: "solid",
    padding: "md"
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
    variant: "solid"
  },
  "方塊:方塊:step": {
    label: "步驟",
    color: "primary",
    variant: "solid"
  },
  "方塊:方塊:timeline": {
    color: "primary",
    variant: "solid"
  },
  "方塊:方塊:timeline-item": {
    color: "primary",
    variant: "solid",
    title: "時間軸項目"
  },
  "方塊:方塊:option-picker": {
    color: "primary",
    variant: "solid",
    title: "選擇選項"
  },
  "方塊:方塊:option-item": {
    value: "option",
    label: "選項"
  },
  "方塊:方塊:book": {
    color: "primary",
    variant: "solid"
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
    cubeResult = await 動態方塊JSX解析器.解析(cubeId, params, ctx, 0);
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
      x-init="updateTextarea()"
    >
      <h1 class="text-3xl font-bold mb-6 text-center">動態方塊測試器</h1>

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
            <div>
              <h3 class="font-semibold mb-2">手動渲染結果 (對比):</h3>
              <div class="bg-base-200 rounded min-h-[100px] flex items-center justify-center">
                <InputField color="primary" variant="solid">
                  <span class="fieldLabel">前綴</span>
                  <input class="fieldInput" placeholder="請輸入內容" />
                  <span class="fieldLabelEnd">後綴</span>
                </InputField>
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
