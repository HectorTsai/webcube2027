import { jsx, createContext, useContext } from 'hono/jsx'

// 佈局元件介面
interface LayoutComponent {
  component: string
  props: Record<string, any>
  children?: LayoutComponent[]
}

// 插槽 Context
interface SlotContextType {
  slots: Record<string, any>
}

const SlotContext = createContext<SlotContextType>({ slots: {} })

// 插槽供應器
export function SlotProvider({ slots, children }: { slots: Record<string, any>; children: any }) {
  return (
    <SlotContext.Provider value={{ slots }}>
      {children}
    </SlotContext.Provider>
  )
}

// 插槽元件
function Slot({ id, ...props }: { id: string; [key: string]: any }) {
  const { slots } = useContext(SlotContext)
  const slotContent = slots[id]
  
  return (
    <div {...props}>
      {slotContent || <div className="text-gray-400 p-4 border-2 border-dashed border-gray-300">
        插槽: {id}
      </div>}
    </div>
  )
}

// JSON 佈局渲染器
export class JSONLayoutRenderer {
  static render(config: LayoutComponent): JSX.Element {
    const { component, props, children } = config
    
    // 轉換 className 和 style
    const elementProps = this.convertProps(props)
    
    switch (component) {
      case 'LayoutBox':
        return (
          <div {...elementProps}>
            {children?.map((child, index) => (
              <div key={index}>
                {this.render(child)}
              </div>
            ))}
          </div>
        )
      
      case 'Text':
        return (
          <span {...elementProps}>
            {props.content || ''}
          </span>
        )
      
      case 'Slot':
        return <Slot id={props.id} {...elementProps} />
      
      default:
        return (
          <div {...elementProps}>
            未知元件: {component}
          </div>
        )
    }
  }
  
  static convertProps(props: Record<string, any>) {
    const elementProps: Record<string, any> = {}
    const style: Record<string, any> = {}
    
    Object.entries(props).forEach(([key, value]) => {
      // CSS 屬性轉換
      if (this.isCSSProperty(key)) {
        style[key] = value
      }
      // HTML 屬性直接使用
      else if (this.isHTMLElementProperty(key)) {
        elementProps[key] = value
      }
      // 其他屬性
      else {
        elementProps[key] = value
      }
    })
    
    // 如果有 style 屬性，加入 elementProps
    if (Object.keys(style).length > 0) {
      elementProps.style = style
    }
    
    return elementProps
  }
  
  static isCSSProperty(key: string): boolean {
    const cssProperties = [
      'display', 'flexDirection', 'flex', 'justifyContent', 'alignItems',
      'gridTemplateColumns', 'gap', 'padding', 'margin', 'width', 'height',
      'minHeight', 'maxWidth', 'backgroundColor', 'color', 'border',
      'borderRadius', 'boxShadow', 'fontSize', 'fontWeight'
    ]
    return cssProperties.includes(key)
  }
  
  static isHTMLElementProperty(key: string): boolean {
    const htmlProperties = ['className', 'id']
    return htmlProperties.includes(key)
  }
}

// 主要的 JSON 佈局元件
export default async function JSONLayout({ 
  layoutConfig, 
  slots = {},
  children 
}: { 
  layoutConfig: LayoutComponent
  slots?: Record<string, any>
  children?: any 
}) {
  try {
    // 如果有 children，將其加入 main-content 插槽
    const finalSlots = {
      ...slots,
      'main-content': children
    }
    
    return (
      <SlotProvider slots={finalSlots}>
        {JSONLayoutRenderer.render(layoutConfig)}
      </SlotProvider>
    )
  } catch (error) {
    console.error('JSON 佈局渲染錯誤:', error)
    return (
      <div className="p-4 border-2 border-red-500 bg-red-50">
        <h3 className="text-red-700 font-bold">佈局渲染錯誤</h3>
        <p className="text-red-600">{error.message}</p>
      </div>
    )
  }
}
