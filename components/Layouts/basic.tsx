import MenuBar from "../MenuBar/MenuBar.tsx";
import Footer from "../Footer/Footer.tsx";
import { Context } from "hono";
import 網站資訊 from "../../database/models/網站資訊.ts";
import 系統資訊 from "../../database/models/系統資訊.ts";

export interface BasicLayoutProps {
  children: unknown;
  className?: string;
  context?: Context;
}

export default async function BasicLayout({
  children,
  className = '',
  context,
  ...restProps
}: BasicLayoutProps) {
  let 名稱:string="WebCube";  
  if(context){
    const lang = context.get("語言") as string;
    const sysInfo = context.get("系統資訊") as 系統資訊;
    if(sysInfo){
      名稱 = await sysInfo.名稱.toStringAsync(lang);
    }
    const info = context.get("網站資訊") as 網站資訊;
    if(info){
      名稱 = await info.名稱.toStringAsync(lang);
    }
  }

  return (
    <div class={`flex flex-col min-h-screen ${className}`} {...restProps}>
      <div><MenuBar  /></div>
      <div class="flex-grow">{children}</div>
      <div><Footer /></div>
    </div>
  );
}