import { MultilingualString } from "@dui/smartmultilingual";
import Icon from "../ui/Icon.tsx"

export interface FooterProps {
  /** Company logo URL */
  logo?: string;
  /** Company name */
  companyName?: string;
  /** Company website URL */
  companyUrl?: string;
  /** Current year */
  year?: number;
  language?: string;
}

export default async function Footer({
  logo = "",
  companyName = "",
  companyUrl = "",
  year = new Date().getFullYear(),
  language = "zh-tw",
}: FooterProps) {
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
            {logo && <Icon id={logo} size="sm" />}
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
            <span> {await right.toStringAsync(language)}.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
