/**
 * Layout component - header, footer, content (using UnoCSS)
 */

import type { VNode } from "@dreamer/view";

interface LayoutProps {
  children?: VNode | VNode[];
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between h-16">
            <a
              href="/"
              className="text-xl font-bold text-indigo-600 hover:text-indigo-700"
            >
              webcube2027
            </a>
            <ul className="flex items-center gap-6 list-none m-0 p-0">
              <li>
                <a
                  href="/"
                  className="text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className="text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  About
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 Built with @dreamer/dweb
          </p>
        </div>
      </footer>
    </div>
  );
}
