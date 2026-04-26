import Popup from "../components/Popup/index.tsx";
import InputField from "../components/InputField/index.tsx";
import Icon from "../components/Icon.tsx";
import Calendar from "../components/Calendar/index.tsx";
import Button from "../components/Button/Button.tsx";

export default function PopupTestPage() {
  return (
    <div class="p-8 max-w-4xl mx-auto">
      
      <h1 class="text-2xl font-bold mb-8">Popup 元件測試</h1>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">基本 Popup 功能</h2>
        <div class="space-y-6">
          <div>
            <h3 class="font-medium mb-2">日期選擇器 Popup</h3>
            <div class="flex flex-col space-y-4">
              <div class="relative">
                <InputField 
                  variant="outline" 
                  color="primary" 
                  className="w-full"
                >
                  <span class="px-3 py-2 text-sm border-r border-gray-300">
                    選擇日期
                  </span>
                  <input 
                    id="popupDateInput" 
                    type="text" 
                    placeholder="請選擇日期" 
                    class="flex-1 px-3 py-2 border-0 text-sm outline-none bg-transparent box-border"
                    readonly
                  />
                  <Button
                    x-on:click="$store.popups.calendarPopup = true"
                  >
                    <Icon name="calendar" size="sm" />
                  </Button>
                </InputField>
                
                <Popup state="calendarPopup">
                  <Calendar targetInputId="popupDateInput" popupState="calendarPopup" />
                </Popup>
              </div>
            </div>
          </div>

          <div>
            <h3 class="font-medium mb-2">自定義內容 Popup</h3>
            <div class="flex flex-col space-y-4">
              <div class="relative">
                <InputField 
                  variant="outline" 
                  color="secondary" 
                  className="w-full"
                >
                  <span class="px-3 py-2 text-sm border-r border-gray-300">
                    選擇選項
                  </span>
                  <input 
                    id="popupCustomInput" 
                    type="text" 
                    placeholder="請選擇選項" 
                    class="flex-1 px-3 py-2 border-0 text-sm outline-none bg-transparent box-border"
                    readonly
                  />
                  <button 
                    class="px-3 py-2 text-sm border-l border-gray-300 hover:bg-gray-100 transition-colors"
                    x-on:click="$store.popups.customPopup = true"
                  >
                    <Icon name="menu" size="sm" />
                  </button>
                </InputField>
                
                <Popup state="customPopup" color="secondary">
                  <div class="p-4 min-w-48">
                    <h4 class="font-semibold mb-3">選擇一個選項</h4>
                    <div class="space-y-2">
                      <button 
                        class="w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
                        x-on:click="$store.popups.customPopup = false; document.getElementById('popupCustomInput').value = '選項一'; document.getElementById('popupCustomInput').innerText = '選項一';"
                      >
                        選項一
                      </button>
                      <button 
                        class="w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
                        x-on:click="$store.popups.customPopup = false; document.getElementById('popupCustomInput').value = '選項二'; document.getElementById('popupCustomInput').innerText = '選項二';"
                      >
                        選項二
                      </button>
                      <button 
                        class="w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
                        x-on:click="$store.popups.customPopup = false; document.getElementById('popupCustomInput').value = '選項三'; document.getElementById('popupCustomInput').innerText = '選項三';"
                      >
                        選項三
                      </button>
                    </div>
                  </div>
                </Popup>
              </div>
            </div>
          </div>

          <div>
            <h3 class="font-medium mb-2">禁用自動關閉的 Popup</h3>
            <div class="flex flex-col space-y-4">
              <div class="relative">
                <InputField 
                  variant="outline" 
                  color="accent" 
                  className="w-full"
                >
                  <span class="px-3 py-2 text-sm border-r border-gray-300">
                    多選項目
                  </span>
                  <input 
                    id="popupMultiInput" 
                    type="text" 
                    placeholder="請選擇多個項目" 
                    class="flex-1 px-3 py-2 border-0 text-sm outline-none bg-transparent box-border"
                    readonly
                  />
                  <button 
                    class="px-3 py-2 text-sm border-l border-gray-300 hover:bg-gray-100 transition-colors"
                    x-on:click="$store.popups.multiPopup = true"
                  >
                    <Icon name="list" size="sm" />
                  </button>
                </InputField>
                
                <Popup color="accent" state="multiPopup">
                  <div class="p-4 min-w-48">
                    <h4 class="font-semibold mb-3">選擇多個項目</h4>
                    <div class="space-y-2" x-data="{ selected: [] }">
                      <label class="flex items-center space-x-2">
                        <input type="checkbox" class="checkbox" x-model="selected" value="項目一" />
                        <span>項目一</span>
                      </label>
                      <label class="flex items-center space-x-2">
                        <input type="checkbox" class="checkbox" x-model="selected" value="項目二" />
                        <span>項目二</span>
                      </label>
                      <label class="flex items-center space-x-2">
                        <input type="checkbox" class="checkbox" x-model="selected" value="項目三" />
                        <span>項目三</span>
                      </label>
                      <div class="pt-2 border-t">
                        <button 
                          class="w-full px-3 py-2 bg-primary text-white rounded"
                          x-on:click="$store.popups.multiPopup = false; document.getElementById('popupMultiInput').value = selected.join(', '); document.getElementById('popupMultiInput').innerText = selected.join(', ');"
                        >
                          確認選擇
                        </button>
                      </div>
                    </div>
                  </div>
                </Popup>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Popup 屬性測試</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-medium mb-2">不同樣式變體</h3>
            <div class="space-y-4">
              <div class="relative">
                <InputField variant="solid" color="primary" className="w-full">
                  <span class="px-3 py-2 text-sm">Solid</span>
                  <input id="solid-input" type="text" placeholder="測試" class="flex-1 px-3 py-2 border-0 text-sm outline-none bg-transparent box-border" readonly />
                  <button x-on:click="$store.popups.solidPopup = true" class="px-3 py-2 text-sm">
                    <Icon name="settings" size="sm" />
                  </button>
                </InputField>
                <Popup autoClose variant="solid" color="primary" state="solidPopup">
                  <div class="p-4">
                    <div class="font-semibold">Solid 樣式 Popup</div>
                    <div class="text-sm opacity-80 mt-1">點擊 Popup 內部或外部關閉</div>
                  </div>
                </Popup>
              </div>

              <div class="relative">
                <InputField variant="outline" color="success" className="w-full">
                  <span class="px-3 py-2 text-sm">Outline</span>
                  <input id="outline-input" type="text" placeholder="測試" class="flex-1 px-3 py-2 border-0 text-sm outline-none bg-transparent box-border" readonly />
                  <button x-on:click="$store.popups.outlinePopup = true" class="px-3 py-2 text-sm">
                    <Icon name="settings" size="sm" />
                  </button>
                </InputField>
                <Popup autoClose variant="outline" color="success" state="outlinePopup">
                  <div class="p-4">
                    <div class="font-semibold">Outline 樣式 Popup</div>
                    <div class="text-sm opacity-80 mt-1">點擊 Popup 內部或外部關閉</div>
                  </div>
                </Popup>
              </div>
            </div>
          </div>

          <div>
            <h3 class="font-medium mb-2">不同顏色主題</h3>
            <div class="space-y-4">
              <div class="relative">
                <InputField variant="crystal" color="warning" className="w-full">
                  <span class="px-3 py-2 text-sm">Warning</span>
                  <input id="warning-input" type="text" placeholder="測試" class="flex-1 px-3 py-2 border-0 text-sm outline-none bg-transparent box-border" readonly />
                  <button x-on:click="$store.popups.warningPopup = true" class="px-3 py-2 text-sm">
                    <Icon name="alert" size="sm" />
                  </button>
                </InputField>
                <Popup autoClose variant="crystal" color="warning" state="warningPopup">
                  <div class="p-4">
                    <div class="font-semibold">Warning 主題 Popup</div>
                    <div class="text-sm opacity-80 mt-1">點擊 Popup 內部或外部關閉</div>
                  </div>
                </Popup>
              </div>

              <div class="relative">
                <InputField variant="dot" color="error" className="w-full">
                  <span class="px-3 py-2 text-sm">Error</span>
                  <input id="error-input" type="text" placeholder="測試" class="flex-1 px-3 py-2 border-0 text-sm outline-none bg-transparent box-border" readonly />
                  <button x-on:click="$store.popups.errorPopup = true" class="px-3 py-2 text-sm">
                    <Icon name="error" size="sm" />
                  </button>
                </InputField>
                <Popup autoClose variant="dot" color="error" state="errorPopup">
                  <div class="p-4">
                    <div class="font-semibold">Error 主題 Popup</div>
                    <div class="text-sm opacity-80 mt-1">點擊 Popup 內部或外部關閉</div>
                  </div>
                </Popup>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}