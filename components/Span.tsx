import { Context } from 'hono';
import { MultilingualString } from "@dui/smartmultilingual";

export interface SpanProps {
  children?: string | MultilingualString | Record<string, string>;
  className?: string;
  context?: Context;
}

export default function Span({ children, className, context }: SpanProps) {
    if (typeof children === 'object' && children !== null && !(children instanceof MultilingualString)) { 
        children = new MultilingualString(children);
    }
    if(children instanceof MultilingualString){
        const lang = context?.get('語言')??'en';
        return (
            <span className={className}>{children.toStringAsync(lang)}</span>
        );
    }
    return (
        <span className={className}>{children}</span>
    );
}