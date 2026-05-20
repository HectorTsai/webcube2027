import { Context } from 'hono';
import { MultilingualString } from "@dui/smartmultilingual";
import { textClasses } from "./classes.ts";

export interface SpanProps {
  children?: string | MultilingualString | Record<string, string>;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "9xl";
  language?: string;
  context?: Context;
}

export default async function Span({ children, className, size="md", language, context }: SpanProps) {
    // 處理字串形式的 JSON 物件
    if (typeof children === 'string' && children.startsWith('{') && children.endsWith('}')) {
        try {
            const parsed = JSON.parse(children);
            if (typeof parsed === 'object' && parsed !== null) {
                children = parsed;
            }
        } catch (e) {
            // 不是有效的 JSON，保持原樣
        }
    }
    
    // 將物件轉換為 MultilingualString
    if (typeof children === 'object' && children !== null && !(children instanceof MultilingualString)) { 
        children = new MultilingualString(children);
    }
    
    const lang = context?.get('語言')??'zh-tw';
    const finalClasses = [
        textClasses[size],
        className
    ].filter(Boolean).join(' ');
    
    if(children instanceof MultilingualString){
        return (
            <span className={finalClasses}>{await children.toStringAsync(lang)}</span>
        );
    }
    
    if(language && typeof children === 'string'){
        const texts : Record<string,string> = {};
        texts[language] = children;
        const text = new MultilingualString(texts);
        return (
            <span className={finalClasses}>{await text.toStringAsync(lang)}</span>
        );
    }
    
    return (    
        <span className={finalClasses}>{children}</span>
    );
}