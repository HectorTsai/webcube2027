import { JSX } from 'hono/jsx'

interface MenuProps {
  items: MenuItem[]
  currentPath?: string
}

interface MenuItem {
  label: string
  href: string
  active?: boolean
}

export function Menu({ items, currentPath }: MenuProps) {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">WebCube2027</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {items.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`${
                    currentPath === item.href
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex space-x-2">
              <button className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                設定
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Menu
