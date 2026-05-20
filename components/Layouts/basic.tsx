import MenuBar, { MenuItem } from "../MenuBar/index.tsx";
import Footer from "../Footer.tsx";
import Icon from "../Icon.tsx";
import { Context } from "hono";
import 網站資訊 from "../../database/models/網站資訊.ts";
import 系統資訊 from "../../database/models/系統資訊.ts";
import { MultilingualString } from "@dui/smartmultilingual";

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
  const copyright = new MultilingualString({
    en: "Copyright",
    "zh-tw": "版權所有",
    "zh-cn": "版权所有",
    "vi": "Bản quyền",
  });
  const right = new MultilingualString({
    en: "All right reserved.",
    "zh-tw": "所有權保留.",
    "zh-cn": "所有權保留.",
    "vi": "Bản quyền.",
  });
  let lang="zh-tw", 名稱:string="WebCube", 圖示:string = "圖示:圖示:web_cube";
  let 版權資料:Record<string,any> = {
    "公司": {
        "en": "Dit Union co., Ltd.",
        "zh-tw": "鼎越國際有限公司",
        "zh-cn": "鼎越国际有限公司",
        "vi": "Dit Union oc., Ltd."
    },
    "網址": "https://www.dui.com.tw",
    "開始年份": 2000  
  }
  if(context){
    lang = context.get("語言") as string;
    const sysInfo = context.get("系統資訊") as 系統資訊;
    if(sysInfo){
      名稱 = await sysInfo.名稱.toStringAsync(lang);
      圖示 = sysInfo.商標;
      版權資料 = sysInfo.版權資料;
    }
    const info = context.get("網站資訊") as 網站資訊;
    if(info){
      名稱 = await info.名稱.toStringAsync(lang);
      圖示 = info.商標;
      版權資料 = info.版權資料;
    }
  }
  const home=new MultilingualString({en: "Home","zh-tw": "首頁","zh-cn": "首页","vi": "Trang chủ"});
  const items = [];
  items.push(<MenuItem><a href="/" class="btn btn-info w-full">{await home.toStringAsync(lang)}</a></MenuItem>);
  return (
    <div class={`flex flex-col min-h-screen ${className}`} {...restProps}>
      <div><MenuBar logo={<><Icon id={圖示} context={context} />`${名稱}`</>} items={items} /></div>
      <div class="flex-grow">{children}</div>
      <div>
        <Footer context={context}>
          {await copyright.toStringAsync(lang)} {版權資料.開始年份}
          {await 版權資料.公司.toStringAsync(lang)} {await right.toStringAsync(lang)}
        </Footer>
      </div>
    </div>
  );
}