import InputField from "../components/InputField/index.tsx";
import Icon from "../components/Icon.tsx";

const svgSearch = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>';
const svgUser = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
const svgMail = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>';
const svgLock = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

export default function InputFieldTestPage() {
  return (
    <div class="p-8 max-w-4xl mx-auto space-y-8">
      <h1 class="text-2xl font-bold mb-8">InputField 组件测试</h1>

      <section>
        <h2 class="text-xl font-semibold mb-4">基础输入框组合</h2>
        <InputField>
          <span class="fieldLabel">前缀</span>
          <input class="fieldInput" placeholder="请输入内容" />
          <span class="fieldLabelEnd">后缀</span>
        </InputField>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-4">带图示的输入框</h2>
        <div class="space-y-4">
          <InputField>
            <span class="fieldLabel">
              {Icon({ svg: svgSearch, size: "sm" })}
            </span>
            <input class="fieldInput" placeholder="搜索..." />
          </InputField>

          <InputField>
            <span class="fieldLabel">
              {Icon({ svg: svgUser, size: "sm" })}
            </span>
            <input class="fieldInput" placeholder="用户名" />
            <span class="fieldLabelEnd">
              {Icon({ svg: svgMail, size: "sm" })}
            </span>
          </InputField>

          <InputField>
            <span class="fieldLabel">
              {Icon({ svg: svgLock, size: "sm" })}
            </span>
            <input class="fieldInput" type="password" placeholder="密码" />
            <span class="fieldLabelEnd">
              {Icon({ svg: svgLock, size: "sm" })}
            </span>
          </InputField>
        </div>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-4">带按钮的输入框</h2>
        <InputField>
          <span class="fieldLabel">搜索</span>
          <input class="fieldInput" placeholder="输入关键词" />
          <button class="fieldButton">搜索</button>
        </InputField>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-4">只带输入框</h2>
        <InputField>
          <input class="fieldInput" placeholder="纯输入框" />
        </InputField>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-4">不同 Variant</h2>
        <div class="space-y-4">
          <InputField variant="outline">
            <span class="fieldLabel">Outline</span>
            <input class="fieldInput" placeholder="Outline 样式" />
          </InputField>
          <InputField variant="solid" color="secondary">
            <span class="fieldLabel">Solid</span>
            <input class="fieldInput" placeholder="Solid 样式" />
          </InputField>
          <InputField variant="ghost">
            <span class="fieldLabel">Ghost</span>
            <input class="fieldInput" placeholder="Ghost 样式" />
          </InputField>
          <InputField variant="dashed" color="accent">
            <span class="fieldLabel">Dashed</span>
            <input class="fieldInput" placeholder="Dashed 样式" />
          </InputField>
        </div>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-4">不同颜色</h2>
        <div class="space-y-4">
          <InputField color="primary">
            <span class="fieldLabel">Primary</span>
            <input class="fieldInput" placeholder="Primary 颜色" />
          </InputField>
          <InputField color="secondary">
            <span class="fieldLabel">Secondary</span>
            <input class="fieldInput" placeholder="Secondary 颜色" />
          </InputField>
          <InputField color="accent">
            <span class="fieldLabel">Accent</span>
            <input class="fieldInput" placeholder="Accent 颜色" />
          </InputField>
          <InputField color="info">
            <span class="fieldLabel">Info</span>
            <input class="fieldInput" placeholder="Info 颜色" />
          </InputField>
          <InputField color="success">
            <span class="fieldLabel">Success</span>
            <input class="fieldInput" placeholder="Success 颜色" />
          </InputField>
          <InputField color="warning">
            <span class="fieldLabel">Warning</span>
            <input class="fieldInput" placeholder="Warning 颜色" />
          </InputField>
          <InputField color="error">
            <span class="fieldLabel">Error</span>
            <input class="fieldInput" placeholder="Error 颜色" />
          </InputField>
        </div>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-4">带选择框</h2>
        <InputField>
          <span class="fieldLabel">国家</span>
          <select class="fieldSelect">
            <option>台湾</option>
            <option>香港</option>
            <option>澳门</option>
          </select>
          <span class="fieldLabelEnd">地区</span>
        </InputField>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-4">多个按钮</h2>
        <InputField>
          <span class="fieldLabel">操作</span>
          <input class="fieldInput" placeholder="输入指令" />
          <button class="fieldButton">执行</button>
          <button class="fieldButton">取消</button>
        </InputField>
      </section>

      <section>
        <h2 class="text-xl font-semibold mb-4">组合测试</h2>
        <InputField variant="outline" color="primary">
          <span class="fieldLabel">
            {Icon({ svg: svgUser, size: "sm" })}
          </span>
          <input class="fieldInput" placeholder="用户名" />
          <span class="fieldLabelEnd">
            {Icon({ svg: svgMail, size: "sm" })}
          </span>
        </InputField>
      </section>
    </div>
  );
}
