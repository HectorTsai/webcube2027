export function Footer() {
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            © 2026 WebCube2027. 版權所有.
          </div>
          <div className="flex space-x-6 text-sm text-gray-500">
            <a href="/about" className="hover:text-gray-700">關於</a>
            <a href="/privacy" className="hover:text-gray-700">隱私權政策</a>
            <a href="/terms" className="hover:text-gray-700">服務條款</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
