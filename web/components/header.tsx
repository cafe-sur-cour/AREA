"use client"

import { NavLinks } from "./NavLinks"
import { UserActions } from "./UserActions"
import { useState } from "react"
import { Menu, X } from "lucide-react"

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 px-6 sm:px-8 lg:px-12 py-4">
      <div className="flex h-20 items-center justify-between max-w-7xl mx-auto">
        {/* Left: Navigation Links */}
        <NavLinks className="hidden lg:flex" />

        {/* Right: Profile / Logout / Login */}
        <UserActions className="hidden lg:flex" />

        <div className="lg:hidden w-full flex items-center justify-end">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-app-text-secondary hover:text-area-primary focus:outline-none focus:text-area-primary transition-all duration-300 p-3 rounded-lg hover:bg-area-light/20"
          >
            {isMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden pt-6 pb-6 space-y-6 border-t border-app-border-light/50 mt-4 bg-white rounded-lg shadow-lg">
          {/* Navigation links */}
          <NavLinks className="flex flex-col space-y-3" isMobile />

          {/* Separation */}
          <div className="border-t border-app-border-light/30 mx-8"></div>

          {/* User actions */}
          <UserActions className="flex flex-col space-y-3" isMobile />
        </div>
      )}
    </nav>
  )
}
