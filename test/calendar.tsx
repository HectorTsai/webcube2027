import Calendar from "../components/Calendar/index.tsx";
import InputField from "../components/InputField/index.tsx";
import Icon from "../components/Icon.tsx";
import Popup from "../components/Popup/index.tsx";
import Button from "../components/Button/Button.tsx";

// 初始化 Alpine.js Store 狀態
  const storeData = `{
    basicPopup: false,
    variantPopup: false,
    fullPopup: false
  }`;

export default function CalendarTestPage() {
  return (
    <div x-data x-init={`Alpine.store('calendarPopups', ${storeData})`} class="p-8 max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-8">Calendar 組件測試</h1>

      <div class="mb-8">
         <h2 class="text-xl font-semibold mb-4">基礎日曆與 Popup 集成</h2>
         <div class="space-y-6">
           <div>
             <h3 class="font-medium mb-2">基本日期選擇器</h3>
             <div class="flex flex-col space-y-4">
               <div class="relative">
                 <Button 
                   variant="solid" 
                   color="primary" 
                   x-on:click="$store.calendarPopups.basicPopup = true"
                 >
                   開啟日曆 Popup
                 </Button>
                 
                 <Popup autoClose={false} state="basicPopup" store="calendarPopups">
                   <Calendar />
                 </Popup>
               </div>
             </div>
           </div>
         </div>
       </div>

      <div class="mb-8">
         <h2 class="text-xl font-semibold mb-4">不同樣式變體的日曆 Popup</h2>
         <div class="space-y-6">
           <div>
             <h3 class="font-medium mb-2">Outline 樣式日曆</h3>
             <div class="flex flex-col space-y-4">
               <div class="relative">
                 <Button 
                   variant="outline" 
                   color="success" 
                   x-on:click="$store.calendarPopups.variantPopup = true"
                 >
                   開啟 Outline 日曆
                 </Button>
                 
                 <Popup autoClose={false} state="variantPopup" store="calendarPopups">
                   <Calendar variant="outline" color="success" />
                 </Popup>
               </div>
             </div>
           </div>
         </div>
       </div>

      <div class="mb-8">
         <h2 class="text-xl font-semibold mb-4">不同顏色主題的日曆</h2>
         <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div>
             <h3 class="font-medium mb-2">Primary</h3>
             <Calendar color="primary" />
           </div>
           
           <div>
             <h3 class="font-medium mb-2">Secondary</h3>
             <Calendar color="secondary" />
           </div>
           
           <div>
             <h3 class="font-medium mb-2">Accent</h3>
             <Calendar color="accent" />
           </div>
           
           <div>
             <h3 class="font-medium mb-2">Success</h3>
             <Calendar color="success" />
           </div>
           
           <div>
             <h3 class="font-medium mb-2">Warning</h3>
             <Calendar color="warning" />
           </div>
           
           <div>
             <h3 class="font-medium mb-2">Error</h3>
             <Calendar color="error" />
           </div>
         </div>
       </div>

      <div class="mb-8">
         <h2 class="text-xl font-semibold mb-4">完整日期選擇器範例（InputField 集成）</h2>
         <div class="space-y-6">
           <div>
             <h3 class="font-medium mb-2">帶有日期輸入功能的完整版本</h3>
             <div class="flex flex-col space-y-4">
               <div class="relative">
                 <InputField 
                   variant="outline" 
                   color="secondary" 
                   className="w-full"
                 >
                   <span class="px-3 py-2 text-sm border-r border-gray-300">
                     選擇日期
                   </span>
                   <input 
                     id="fullDateInput" 
                     type="text" 
                     placeholder="請選擇日期" 
                     class="flex-1 px-3 py-2 border-0 text-sm outline-none bg-transparent box-border"
                     readonly
                   />
                   <button 
                     class="px-3 py-2 text-sm border-l border-gray-300 hover:bg-gray-100 transition-colors"
                     x-on:click="$store.calendarPopups.fullPopup = true"
                   >
                     <Icon name="calendar" size="sm" />
                   </button>
                 </InputField>
                 
                 <Popup autoClose={false} state="fullPopup" store="calendarPopups">
                   <Calendar targetInputId="fullDateInput" popupState="fullPopup" popupStore="calendarPopups" />
                 </Popup>
               </div>
             </div>
           </div>
         </div>
       </div>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">使用說明</h2>
        <div class="p-4 bg-base-200 rounded-lg">
          <ul class="list-disc list-inside space-y-1 text-sm text-base-content/80">
            <li><strong>Popup 狀態管理</strong>：使用 Alpine.js Store 管理 Popup 顯示狀態</li>
            <li><strong>autoClose=false</strong>：Calendar 需要禁用內部點擊關閉，以便切換月份</li>
            <li><strong>選擇日期自動關閉</strong>：Calendar 組件在選擇日期後會主動關閉 Popup</li>
            <li><strong>外部點擊關閉</strong>：點擊 Popup 外部背景會關閉 Popup</li>
            <li><strong>月份切換</strong>：點擊「上一個月/下一個月」按鈕不會關閉 Popup</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
