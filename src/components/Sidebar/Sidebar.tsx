"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  ListTodo,
  Heart,
  Archive,
  Building2,
  Users,
  FileText,
  Tag,
  BarChart3,
  Clock,
  User,
  Settings,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  section?: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "All Applications",
    href: "/applications",
    icon: <ListTodo size={20} />,
    section: "APPLICATIONS",
  },
  {
    label: "Find Jobs",
    href: "/jobs",
    icon: <Building2 size={20} />,
  },
  {
    label: "Wishlist",
    href: "/wishlist",
    icon: <Heart size={20} />,
  },
  {
    label: "Archived",
    href: "/archived",
    icon: <Archive size={20} />,
  },
  {
    label: "Companies",
    href: "/companies",
    icon: <Building2 size={20} />,
    section: "MANAGEMENT",
  },
  {
    label: "Contacts",
    href: "/contacts",
    icon: <Users size={20} />,
  },
  {
    label: "Documents",
    href: "/documents",
    icon: <FileText size={20} />,
  },
  {
    label: "Tags",
    href: "/tags",
    icon: <Tag size={20} />,
  },
  {
    label: "Statistics",
    href: "/statistics",
    icon: <BarChart3 size={20} />,
    section: "ANALYTICS",
  },
  {
    label: "Activity",
    href: "/activity",
    icon: <Clock size={20} />,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: <User size={20} />,
    section: "SETTINGS",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings size={20} />,
  },
];

export function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  const getSections = () => {
    const sections: { [key: string]: NavItem[] } = {};
    let currentSection = "main";

    navItems.forEach((item) => {
      if (item.section) {
        currentSection = item.section;
      }
      if (!sections[currentSection]) {
        sections[currentSection] = [];
      }
      sections[currentSection].push(item);
    });

    return sections;
  };

  const sections = getSections();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed left-0 top-0 h-screen w-64 bg-white border-r border-neutral-200 z-40 transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">J</span>
              </div>
              <span className="font-semibold text-neutral-900 text-sm">
                JobTracker
              </span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden hover:bg-neutral-100 p-1 rounded-lg transition-colors"
            >
              <X size={20} className="text-neutral-600" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
            {Object.entries(sections).map(([section, items]) => (
              <div key={section}>
                {section !== "main" && (
                  <h3 className="px-2 mb-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    {section}
                  </h3>
                )}
                <div className="space-y-1">
                  {items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={clsx(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                          isActive
                            ? "bg-primary-100 text-primary-700"
                            : "text-neutral-700 hover:bg-neutral-100",
                        )}
                      >
                        <div
                          className={clsx(
                            "transition-colors",
                            isActive
                              ? "text-primary-600"
                              : "text-neutral-400 group-hover:text-neutral-600",
                          )}
                        >
                          {item.icon}
                        </div>
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Spacer for desktop */}
      <div className="hidden lg:flex w-64 flex-shrink-0" />
    </>
  );
}
