import Calendar from "../components/Calendar/index.tsx";

export default function CalendarTestPage() {
  return (
    <div class="p-8 max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-8">Calendar 组件测试</h1>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">基础日历</h2>
        <Calendar />
      </div>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">不同 Variant 日历</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 class="font-medium mb-2">Outline</h3>
            <Calendar variant="outline" color="primary" />
          </div>
          <div>
            <h3 class="font-medium mb-2">Diagonal Stripes</h3>
            <Calendar variant="diagonal-stripes" color="secondary" />
          </div>
          <div>
            <h3 class="font-medium mb-2">Crystal</h3>
            <Calendar variant="crystal" color="accent" />
          </div>
        </div>
      </div>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">不同颜色日历</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
    </div>
  );
}
