import { MultilingualString } from "@dui/smartmultilingual";
import Icon from "../ui/Icon.tsx"
import { Context } from "hono";

export interface FooterProps {
  /** Hono context for API calls */
  context?: Context;
}

export default async function Footer({
  context
}: FooterProps) {
  // 從 API 取得網站資訊
  let logo = "";
  let companyName = "";
  let companyUrl = "";
  let year = new Date().getFullYear();
  
  if (context) {
    try {
      const { InnerAPI } = await import('../../services/index.ts');
      const response = await InnerAPI(context, "/api/v1/info");
      const info = await response.json();
      
      // 取得基本資訊
      logo = info.data?.商標 || "";
      companyName = info.data?.版權資料?.公司 || "WebCube 2027";
      companyUrl = info.data?.版權資料?.網址 || "";
    } catch (error) {
      // API 失敗時使用預設值
      console.error('Footer API 失敗:', error);
    }
  }
  
  const right = new MultilingualString({
    en:"All rights reserved.",
    "zh-tw": "版權所有",
    vi: "Bảo lưu mọi quyền lợi."
  });
  return (
    <footer class="w-full border-t border-base-300 bg-primary text-primary-content">
      <div class="w-full">
        <div class="flex flex-col items-center space-y-4">
          {/* Copyright */}
          <p class="text-sm flex items-center" style="text-align: center; width: 100%; display: flex; justify-content: center; gap: 0.5rem;">
            {logo && <Icon id={logo} className="w-10" context={context} />}
            <span>@{year} </span>
            {companyUrl ? (
              <a 
                href={companyUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                class="text-primary-content hover:text-primary-content transition-colors"
              >
                {companyName}
              </a>
            ) : (
              <span>{companyName}</span>
            )}
            <span> {await right.toStringAsync(context?.get('語言') || 'zh-tw')}.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
