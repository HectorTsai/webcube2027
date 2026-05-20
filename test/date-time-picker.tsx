import DatePicker from "../components/DatePicker.tsx";
import TimePicker from "../components/TimePicker.tsx";
import Span from "../components/Span.tsx";

export default async function DateTimePickerTestPage() {
  return (
    <div class="p-6 max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">DateTimePicker 測試</h1>

      {/* 一行3個 - 不同顏色 */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">一行3個 - 不同顏色 (size: sm)</h2>
        <div class="flex gap-4">
          <DatePicker name="date1" value="2024-01-15" title="primary" color="primary" size="sm" />
          <DatePicker name="date2" value="2024-02-20" title="secondary" color="secondary" size="sm" />
          <DatePicker name="date3" value="2024-03-25" title="accent" color="accent" size="sm" />
        </div>
      </section>

      {/* 一行2個 - 不同variant */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">一行2個 - 不同variant (size: md)</h2>
        <div class="grid grid-cols-2 gap-4">
          <DatePicker name="date4" value="2024-04-10" title="solid" variant="solid" color="info" />
          <DatePicker name="date5" value="2024-05-15" title="outline" variant="outline" color="success" />
        </div>
      </section>

      {/* 一行2個 - ghost + warning */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">一行2個 - crystal variant</h2>
        <div class="grid grid-cols-2 gap-4">
          <DatePicker name="date6" value="2024-06-20" title="crystal - warning" variant="crystal" color="warning" size="lg" />
          <DatePicker name="date7" value="2024-07-25" title="crystal - error" variant="crystal" color="error" size="lg" />
        </div>
      </section>

      {/* 一行3個 - 大尺寸 */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">一行3個</h2>
        <div class="flex gap-4">
          <DatePicker name="date8" value="2024-08-01" title="info" variant="gradient-right" color="info" size="sm" />
          <DatePicker name="date9" value="2024-09-15" title="success" color="success" variant="gradient-down" size="sm" />
          <DatePicker name="date10" value="2024-10-20" title="warning" color="warning" variant="gradient-left" size="sm" />
        </div>
      </section>

      {/* TimePicker 24h */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">TimePicker - 24小時制 (size: md)</h2>
        <TimePicker name="meeting_time" value="14:30" use24Hour={true} title="solid - default - md" />
      </section>

      {/* TimePicker size sm */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">TimePicker - 小尺寸 (size: sm)</h2>
        <TimePicker name="small_time" value="09:15" use24Hour={true} title="solid - default - sm" size="sm" color="accent" />
      </section>

      {/* TimePicker size lg */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">TimePicker - 大尺寸 (size: lg)</h2>
        <TimePicker name="large_time" value="18:45" use24Hour={true} title="solid - default - lg" size="lg" color="secondary" />
      </section>

      {/* TimePicker 12h */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">TimePicker - 12小時制</h2>
        <TimePicker name="alarm_time" value="03:30" use24Hour={false} title="outline - primary - md" variant="outline" color="primary" />
      </section>

      {/* TimePicker 5min */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">TimePicker - 5分鐘間隔</h2>
        <TimePicker name="schedule_time" value="10:25" minuteInterval={5} title="ghost - secondary - md" variant="ghost" color="secondary" />
      </section>

      {/* 一行3個 - 不同顏色 (size: sm) */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">一行3個 - TimePicker 不同顏色 (size: sm)</h2>
        <div class="flex gap-4">
          <TimePicker name="time1" value="08:00" use24Hour={true} title="primary" color="primary" size="sm" />
          <TimePicker name="time2" value="12:30" use24Hour={true} title="secondary" color="secondary" size="sm" />
          <TimePicker name="time3" value="18:45" use24Hour={true} title="accent" color="accent" size="sm" />
        </div>
      </section>

      {/* 一行2個 - 不同variant */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">一行2個 - TimePicker 不同variant (size: md)</h2>
        <div class="grid grid-cols-2 gap-4">
          <TimePicker name="time4" value="09:15" use24Hour={true} title="crystal - info" variant="crystal" color="info" />
          <TimePicker name="time5" value="14:30" use24Hour={true} title="outline - success" variant="outline" color="success" />
        </div>
      </section>

      {/* 顯示選擇結果 */}
      <section class="mb-8">
        <h2 class="text-lg font-bold mb-3">選擇結果</h2>
        <div x-data class="p-4 bg-primary text-primary-content rounded-lg">
          <p>日期: <span x-text="$store.DatePicker?.date || '未選擇'"></span></p>
          <p class="mt-2">時間: <span x-text="$store.TimePicker?.time || '未選擇'"></span></p>
        </div>
      </section>

      {/* 說明 */}
      <section class="mt-8 p-4 bg-gray-100 rounded">
        <h3 class="font-bold mb-2">使用說明</h3>
        <ul class="list-disc list-inside space-y-1">
          <li><strong>DatePicker</strong>: 年/月/日滾動選擇，類似 iPhone 日期選擇器</li>
          <li><strong>TimePicker</strong>: 時/分滾動選擇，支援 24 小時制和 12 小時制</li>
          <li><strong>value</strong>: 初始值，DatePicker 使用 YYYY-MM-DD，TimePicker 使用 HH:mm</li>
          <li><strong>size</strong>: 尺寸，可設定為 sm、md、lg</li>
          <li><strong>title</strong>: 標題，顯示在選擇器上方</li>
          <li><strong>name</strong>: 表單欄位名稱，會生成 hidden input</li>
          <li><strong>minuteInterval</strong>: 分鐘間隔，可設定為 1, 5, 10, 15, 30 等</li>
          <li><strong>variant/color</strong>: 樣式和顏色，與 Button 元件一致</li>
          <li>選擇結果會存儲在 <code>$store.DatePicker</code> 和 <code>$store.TimePicker</code> 中</li>
        </ul>
      </section>
    </div>
  );
}
