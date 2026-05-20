import { Context } from 'hono';
import Span from '../components/Span.tsx';
import Card from '../components/Card/index.tsx';

export default async function SpanTestPage(ctx: Context) {
  return (
    <div class="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <h1 class="text-3xl font-bold mb-6 text-center">Span 元件測試</h1>

      <Card className="mb-6" padding="lg" variant="outline">
        <h2 class="text-xl font-semibold mb-4">基本測試</h2>
        <div class="space-y-4">
          <div>
            <span class="text-sm text-gray-600 mb-2">純文字 children:</span>
            <Span>這是測試文字</Span>
          </div>
          
          <div>
            <span class="text-sm text-gray-600 mb-2">多語言物件 children:</span>
            <Span>
              {{"en": "Hello World", "zh-tw": "你好世界", "zh-cn": "你好世界"}}
            </Span>
          </div>
          
          <div>
            <span class="text-sm text-gray-600 mb-2">不同 size:</span>
            <Span size="xs" className="px-1">xs文字</Span>
            <Span size="sm" className="px-1">sm文字</Span>
            <Span size="md" className="px-1">md文字</Span>
            <Span size="lg" className="px-1">lg文字</Span>
            <Span size="xl" className="px-1">xl文字</Span>
            <Span size="2xl" className="px-1">2xl文字</Span>
          </div>
        </div>
      </Card>

      <Card className="mb-6" padding="lg" variant="outline" color="info">
        <h2 class="text-xl font-semibold mb-4">作為 prop 傳遞 children</h2>
        <div class="space-y-4">
          <div>
            <span class="text-sm text-gray-600 mb-2">children 作為 prop (字串):</span>
            <Span children="這是作為 prop 傳遞的文字" />
          </div>
          
          <div>
            <span class="text-sm text-gray-600 mb-2">children 作為 prop (物件):</span>
            <Span children={{"en": "Prop Hello", "zh-tw": "Prop 你好"}} />
          </div>
          <div>
            <span class="text-sm text-gray-600 mb-2">children 作為 prop (字串):</span>
            <Span children='{"en":"Text Block","zh-tw":"文字區塊","zh-cn":"文字區塊","ja":"テキストブロック","vi":"Bộ việt"}' />
          </div>
        </div>
      </Card>
    </div>
  );
}
