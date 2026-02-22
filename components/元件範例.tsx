/**
 * 元件使用範例
 */

import { createSignal } from "@dreamer/view";
import 按鈕 from "./實心/按鈕.tsx";
import 輸入框 from "./實心/輸入框.tsx";

export default function 元件範例() {
  const [text, setText] = createSignal("");

  return (
    <div class="p-4 space-y-4">
      <h2 class="text-xl font-bold">元件範例</h2>

      {/* 按鈕範例 */}
      <div class="space-x-2">
        <按鈕 顏色="主要" 尺寸="大">
          大按鈕
        </按鈕>
        <按鈕 顏色="次要" 尺寸="中">
          中按鈕
        </按鈕>
        <按鈕 顏色="錯誤" 尺寸="小" 外框>
          小輪廓按鈕
        </按鈕>
      </div>

      {/* 輸入框範例 */}
      <div class="space-y-2">
        <輸入框
          顏色="主要"
          尺寸="大"
          placeholder="大輸入框"
          value={text()}
          onInput={setText}
        />
        <輸入框
          顏色="成功"
          尺寸="中"
          placeholder="中輸入框"
        />
        <輸入框
          顏色="警告"
          尺寸="小"
          placeholder="小輸入框"
        />
      </div>

      {/* 圓角範例 */}
      <div class="space-y-2">
        <h3 class="text-lg font-semibold">圓角範例</h3>
        <div class="flex flex-wrap gap-2">
          <按鈕 顏色="主要" 尺寸="中" 圓角="大">
            大圓角
          </按鈕>
          <按鈕 顏色="次要" 尺寸="中" 圓角="中">
            中圓角
          </按鈕>
          <按鈕 顏色="強調" 尺寸="中" 圓角="小">
            小圓角
          </按鈕>
        </div>
      </div>
    </div>
  );
}
