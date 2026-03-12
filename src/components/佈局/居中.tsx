interface 居中佈局Props {
  children: unknown
}

export default function 居中佈局({ children }: 居中佈局Props) {
  return (
    <div className="min-h-screen bg-背景1 text-背景內容 flex items-center justify-center">
      <div className="webcube-容器">
        <div className="webcube-卡片 max-w-2xl">
          {children}
        </div>
      </div>
    </div>
  )
}
