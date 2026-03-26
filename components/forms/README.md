# 表單組件

## 🎯 職責範圍
- 表單相關方塊
- 資料處理
- 使用者輸入驗證

## 📋 可用組件類型
- **聯絡表單** (ContactForm) - 聯絡我們表單
- **搜尋框** (SearchBox) - 搜尋功能
- **訂閱表單** (NewsletterForm) - 電子報訂閱
- **登入表單** (LoginForm) - 使用者登入
- **註冊表單** (SignupForm) - 使用者註冊
- **意見回饋** (FeedbackForm) - 意見收集

## 🎨 樣式規範
- 使用 UnoCSS classes
- 表單驗證狀態
- 錯誤提示
- 一致的輸入體驗

## 📝 範例模板
```tsx
interface ContactFormProps {
  onSubmit?: (data: ContactFormData) => void;
  fields?: {
    name?: boolean;
    email?: boolean;
    phone?: boolean;
    message?: boolean;
  };
}

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export default function ContactForm({ 
  onSubmit, 
  fields = { name: true, email: true, phone: false, message: true }
}: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const validateForm = (): boolean => {
    const newErrors: Partial<ContactFormData> = {};
    
    if (fields.name && !formData.name.trim()) {
      newErrors.name = '姓名為必填項目';
    }
    
    if (fields.email && !formData.email.trim()) {
      newErrors.email = 'Email 為必填項目';
    } else if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email 格式不正確';
    }
    
    if (fields.message && !formData.message.trim()) {
      newErrors.message = '訊息為必填項目';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit?.(formData);
      // 重置表單
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('表單提交失敗:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fields.name && (
        <div>
          <label className="block text-sm font-medium mb-2">姓名 *</label>
          <Input
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            placeholder="請輸入您的姓名"
            error={errors.name}
          />
        </div>
      )}
      
      {fields.email && (
        <div>
          <label className="block text-sm font-medium mb-2">Email *</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(value) => setFormData({ ...formData, email: value })}
            placeholder="請輸入您的 Email"
            error={errors.email}
          />
        </div>
      )}
      
      {fields.phone && (
        <div>
          <label className="block text-sm font-medium mb-2">電話</label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(value) => setFormData({ ...formData, phone: value })}
            placeholder="請輸入您的電話"
          />
        </div>
      )}
      
      {fields.message && (
        <div>
          <label className="block text-sm font-medium mb-2">訊息 *</label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="請輸入您的訊息"
            rows={4}
            className="input w-full resize-none"
          />
          {errors.message && (
            <p className="text-error text-sm mt-1">{errors.message}</p>
          )}
        </div>
      )}
      
      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? '送出中...' : '送出表單'}
      </Button>
    </form>
  );
}
```

## 🚨 重要規則
- **表單驗證** - 客戶端和伺服器端驗證
- **錯誤處理** - 清晰的錯誤提示
- **無障礙** - 支援屏幕閱讀器
- **安全性** - 防止 XSS 和 CSRF

## 📦 相依組件
- `Input` - 輸入框
- `Button` - 按鈕
- 可能需要 useState 和表單驗證函式
