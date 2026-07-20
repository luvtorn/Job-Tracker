"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  ListTodo,
  Heart,
  Building2,
  BarChart3,
  User,
  Bell,
  CalendarDays,
  ContactRound,
  NotebookPen,
  AlarmClock,
  Settings,
} from "lucide-react";
import { useTranslations } from 'next-intl';

type NavigationKey = 'dashboard' | 'applications' | 'findJobs' | 'wishlist' | 'calendar' | 'companies' | 'contacts' | 'notes' | 'reminders' | 'notifications' | 'statistics' | 'profile' | 'settings';
type SectionKey = 'workspace' | 'analytics' | 'settings' | 'applications';

interface NavItem {
  label: NavigationKey;
  href: string;
  icon: React.ReactNode;
  section?: SectionKey;
}

const navItems: NavItem[] = [
  {
    label: "dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "applications",
    href: "/applications",
    icon: <ListTodo size={20} />,
    section: "applications",
  },
  {
    label: "findJobs",
    href: "/jobs",
    icon: <Building2 size={20} />,
  },
  {
    label: "wishlist",
    href: "/wishlist",
    icon: <Heart size={20} />,
  },
  {
    label: "calendar",
    href: "/calendar",
    icon: <CalendarDays size={20} />,
  },
  { label: "companies", href: "/companies", icon: <Building2 size={20} />, section: "workspace" },
  { label: "contacts", href: "/contacts", icon: <ContactRound size={20} /> },
  { label: "notes", href: "/notes", icon: <NotebookPen size={20} /> },
  { label: "reminders", href: "/reminders", icon: <AlarmClock size={20} /> },
  {
    label: "notifications",
    href: "/notifications",
    icon: <Bell size={20} />,
  },
  {
    label: "statistics",
    href: "/statistics",
    icon: <BarChart3 size={20} />,
    section: "analytics",
  },
  {
    label: "profile",
    href: "/profile",
    icon: <User size={20} />,
    section: "settings",
  },
  { label: 'settings', href: '/settings', icon: <Settings size={20} /> },
];

export function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const t = useTranslations('navigation');

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
                    {t(section as SectionKey)}
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
                          {t(item.label)}
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
