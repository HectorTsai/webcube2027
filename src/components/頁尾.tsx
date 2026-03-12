import 實心頁尾 from './實心/頁尾.tsx'

interface 頁尾Props {
  版權?: string
  連結?: Array<{ 標籤: string; 連結: string }>
  顏色?: '主要' | '次要' | '成功' | '警告' | '錯誤' | '資訊'
  風格: string // 必要參數，從 route 傳入
  className?: string
}

export default async function 頁尾({ 風格, ...props }: 頁尾Props) {
  try {
    // 1. 先嘗試從檔案系統載入
    const Footer = (await import(`./${風格}/頁尾.tsx`)).default
    return <Footer {...props} />
  } catch (_e) {
    // 2. 檔案載入失敗，使用預設實心頁尾
    return <實心頁尾 {...props} />
  }
}
