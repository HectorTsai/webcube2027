import Input from "../components/Input/index.tsx";

export default function InputTestPage() {
  return (
    <div class="p-8 max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-8">Input 组件测试</h1>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">基础输入框</h2>
        <Input placeholder="请输入内容" />
      </div>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">不同 Variant 输入框</h2>
        <div class="space-y-4">
          <div>
            <h3 class="font-medium mb-2">Outline</h3>
            <Input variant="outline" color="primary" placeholder="Outline 输入框" />
          </div>
          <div>
            <h3 class="font-medium mb-2">Solid</h3>
            <Input variant="solid" color="secondary" placeholder="Solid 输入框" />
          </div>
          <div>
            <h3 class="font-medium mb-2">Crystal</h3>
            <Input variant="crystal" color="accent" placeholder="Crystal 输入框" />
          </div>
        </div>
      </div>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">带标签的输入框</h2>
        <div class="space-y-4">
          <div>
            <h3 class="font-medium mb-2">前端标签</h3>
            <Input frontLabel="前缀測試" placeholder="带前端标签的输入框" />
          </div>
          <div>
            <h3 class="font-medium mb-2">后端标签</h3>
            <Input endLabel="后缀" placeholder="带后端标签的输入框" />
          </div>
          <div>
            <h3 class="font-medium mb-2">前后端标签</h3>
            <Input frontLabel="前缀" endLabel="后缀" placeholder="带前后端标签的输入框" />
          </div>
        </div>
      </div>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">浮动标签</h2>
        <Input floatLabel="浮动标签" placeholder="请输入内容" />
      </div>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">带前缀的浮动标签</h2>
        <Input variant="outline" frontLabel="前缀" floatLabel="浮动标签" placeholder="请输入内容" />
      </div>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">不同类型的输入框</h2>
        <div class="space-y-4">
          <div>
            <h3 class="font-medium mb-2">密码输入框</h3>
            <Input type="password" placeholder="请输入密码" />
          </div>
          <div>
            <h3 class="font-medium mb-2">数字输入框</h3>
            <Input type="number" placeholder="请输入数字" />
          </div>
          <div>
            <h3 class="font-medium mb-2">邮箱输入框</h3>
            <Input type="email" placeholder="请输入邮箱" />
          </div>
        </div>
      </div>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">自定义样式</h2>
        <Input className="w-full max-w-md" placeholder="自定义宽度的输入框" />
      </div>
    </div>
  );
}
