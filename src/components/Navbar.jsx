import React, { useState } from 'react';
import { Menu, X, Code2, BookOpen, Github } from 'lucide-react';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Code2 className="h-8 w-8 text-blue-400" />
            <h1 className="ml-2 text-2xl font-bold italic text-white">
              Algo <span className="text-blue-400">Animate</span>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
              Algorithms
            </a>
            <a href="#" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
              Visualizer
            </a>
            <a href="#" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
              Learn
            </a>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-blue-500/20 text-blue-400 px-4 py-2 rounded-md text-sm font-medium 
                       hover:bg-blue-500/30 transition-colors duration-200 border border-blue-400/30"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 
                       hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-800/50 backdrop-blur-sm border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <a
              href="#"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 
                       hover:text-white hover:bg-gray-700 transition-colors duration-200"
            >
              Algorithms
            </a>
            <a
              href="#"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 
                       hover:text-white hover:bg-gray-700 transition-colors duration-200"
            >
              Visualizer
            </a>
            <a
              href="#"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 
                       hover:text-white hover:bg-gray-700 transition-colors duration-200"
            >
              Learn
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-blue-400 
                       hover:bg-blue-500/20 transition-colors duration-200"
            >
              <Github className="h-5 w-5" />
              GitHub
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;