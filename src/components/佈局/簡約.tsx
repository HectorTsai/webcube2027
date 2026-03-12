interface 簡約佈局Props {
  children: unknown
}

export default function 簡約佈局({ children }: 簡約佈局Props) {
  return (
    <div className="min-h-screen bg-背景1 text-背景內容">
      <div className="webcube-容器 py-8">
        <div className="webcube-卡片">
          {children}
        </div>
      </div>
    </div>
  )
}
