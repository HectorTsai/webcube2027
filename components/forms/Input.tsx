export interface InputProps {
  /** Placeholder text displayed when input is empty */
  placeholder?: string;
  /** Input type (text, email, password, etc.) */
  type?: "text" | "email" | "password" | "number" | "tel";
  /** Current value of the input */
  value?: string;
  /** Whether the input is required */
  required?: boolean;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Function called when input value changes */
  onChange?: (value: string) => void;
}

export default function Input({
  placeholder = "Enter text...",
  type = "text",
  value = "",
  required = false,
  disabled = false,
  onChange,
}: InputProps) {
  // 使用 UnoCSS 自訂 preset 的 classes
  const baseClasses = "input w-full";
  const disabledClasses = disabled ? "opacity-60 cursor-not-allowed" : "";

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      required={required}
      disabled={disabled}
      class={`${baseClasses} ${disabledClasses}`}
      onChange={(e) => {
        const value = (e.target as any)?.value || "";
        onChange?.(value);
      }}
    />
  );
}
