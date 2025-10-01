"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { href: "/", label: "Home" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/about", label: "About" },
]

interface NavLinksProps {
  className?: string
  isMobile?: boolean
}

export function NavLinks({ className, isMobile }: NavLinksProps) {
  const pathname = usePathname()

  return (
    <div className={`flex ${isMobile ? "flex-col space-y-3" : "space-x-8"} items-center ${className}`}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`relative font-heading transition-all duration-300 group ${
            isMobile ? "text-center py-2 text-lg" : ""
          } ${
            pathname === item.href
              ? "text-area-primary font-semibold"
              : "text-app-text-secondary hover:text-area-primary font-medium"
          }`}
        >
          {item.label}
          <span
            className={`absolute ${isMobile ? "bottom-0 left-1/2 -translate-x-1/2" : "-bottom-1 left-0"} ${isMobile ? "w-0 group-hover:w-1/2" : "w-0 group-hover:w-full"} h-0.5 bg-gradient-to-r from-area-primary to-area-hover transition-all duration-300 ${
              pathname === item.href ? (isMobile ? "w-1/2" : "w-full") : ""
            }`}
          ></span>
        </Link>
      ))}
    </div>
  )
}
