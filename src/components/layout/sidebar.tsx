"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const menuItems = [
  {
    title: "Clientes",
    href: "/clientes",
    icon: "group", // Material Design icon for users/clients
  },
  {
    title: "Productos",
    icon: "expand_more", // Material Design dropdown arrow
    submenu: [
      {
        title: "Academia",
        href: "/productos/academia",
        icon: "school", // Material Design icon for education
      },
      {
        title: "Clases",
        href: "/productos/clases",
        icon: "event", // Material Design icon for events/classes
      },
    ],
  },
  {
    title: "Configuración",
    href: "/configuracion",
    icon: "settings", // Material Design settings icon
  },
]

const MaterialIcon = ({
  name,
  className = "",
  filled = false,
}: {
  name: string
  className?: string
  filled?: boolean
}) => (
  <span
    className={cn("material-symbols-outlined select-none", filled && "material-symbols-filled", className)}
    style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
  >
    {name}
  </span>
)

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(["Productos"])
  const pathname = usePathname()

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]))
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="h-16 px-6 border-b border-sidebar-border flex items-center">
        <h2 className="text-xl font-bold text-sidebar-foreground">ClubOS</h2>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <div key={item.title}>
            {item.submenu ? (
              <div>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between text-left font-medium",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    expandedItems.includes(item.title) && "bg-sidebar-accent text-sidebar-accent-foreground",
                  )}
                  onClick={() => toggleExpanded(item.title)}
                >
                  <span className="flex items-center gap-3">
                    <MaterialIcon
                      name={expandedItems.includes(item.title) ? "expand_less" : "expand_more"}
                      className="text-lg transition-colors"
                    />
                    {item.title}
                  </span>
                </Button>

                {expandedItems.includes(item.title) && (
                  <div className="ml-4 mt-2 space-y-1">
                    {item.submenu.map((subItem) => (
                      <Link key={subItem.href} href={subItem.href}>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-3 text-sm",
                            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            pathname === subItem.href &&
                              "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary",
                          )}
                        >
                          <MaterialIcon
                            name={subItem.icon}
                            className={cn(
                              "text-lg transition-colors",
                              pathname === subItem.href ? "text-sidebar-primary-foreground" : "text-muted-foreground",
                            )}
                            filled={pathname === subItem.href}
                          />
                          {subItem.title}
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    pathname === item.href &&
                      "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary",
                  )}
                >
                  <MaterialIcon
                    name={item.icon}
                    className={cn(
                      "text-lg transition-colors",
                      pathname === item.href ? "text-sidebar-primary-foreground" : "text-muted-foreground",
                    )}
                    filled={pathname === item.href}
                  />
                  {item.title}
                </Button>
              </Link>
            )}
          </div>
        ))}
      </nav>
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MaterialIcon name={isOpen ? "close" : "menu"} className="text-xl" />
      </Button>

      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out",
          "md:translate-x-0 md:static md:z-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
