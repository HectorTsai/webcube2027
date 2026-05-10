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