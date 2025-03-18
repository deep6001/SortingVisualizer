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
       
            <a
              href="https://github.com/deep6001"
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
      
    </nav>
  );
}

export default Navbar;