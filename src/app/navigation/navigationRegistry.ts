import { AlertTriangle, Archive, CalendarArrowDown, CalendarCheck, Donut, FolderKanban, Inbox, LandPlot, ListOrdered, ListTodo, Settings, Trash2 } from "lucide-react";
import { ViewId } from "../../viewModel";

export interface NavigationDestination {
  id: ViewId;
  label: string;
  icon: typeof CalendarCheck;
  desktop: boolean;
  mobileDockPage: 0 | 1 | null;
  order: number;
  mobileOrder?: number;
  routeKey: ViewId;
  capabilities: string[];
}

export const navigationRegistry: NavigationDestination[] = [
  { id: "today", label: "Today", icon: CalendarCheck, desktop: true, mobileDockPage: 0, order: 10, routeKey: "today", capabilities: [] },
  { id: "inbox", label: "Inbox", icon: Inbox, desktop: true, mobileDockPage: 0, order: 20, routeKey: "inbox", capabilities: [] },
  { id: "all", label: "Tasks", icon: ListTodo, desktop: true, mobileDockPage: 0, order: 30, routeKey: "all", capabilities: [] },
  { id: "lists", label: "Lists", icon: ListOrdered, desktop: true, mobileDockPage: 0, order: 40, routeKey: "lists", capabilities: [] },
  { id: "projects", label: "Projects", icon: FolderKanban, desktop: true, mobileDockPage: 0, order: 50, routeKey: "projects", capabilities: [] },
  { id: "areas", label: "Areas", icon: LandPlot, desktop: true, mobileDockPage: 1, order: 55, routeKey: "areas", capabilities: [] },
  { id: "bakery", label: "Bakery", icon: Donut, desktop: true, mobileDockPage: 1, order: 57, mobileOrder: 95, routeKey: "bakery", capabilities: ["game"] },
  { id: "upcoming", label: "Upcoming", icon: CalendarArrowDown, desktop: true, mobileDockPage: 0, order: 60, routeKey: "upcoming", capabilities: [] },
  { id: "overdue", label: "Overdue", icon: AlertTriangle, desktop: true, mobileDockPage: 1, order: 70, routeKey: "overdue", capabilities: [] },
  { id: "someday", label: "Someday", icon: Archive, desktop: true, mobileDockPage: 1, order: 80, routeKey: "someday", capabilities: [] },
  { id: "trash", label: "Trash", icon: Trash2, desktop: true, mobileDockPage: 1, order: 90, routeKey: "trash", capabilities: [] },
  { id: "settings", label: "Settings", icon: Settings, desktop: true, mobileDockPage: 1, order: 100, routeKey: "settings", capabilities: [] },
];

export const desktopNav = navigationRegistry.filter((item) => item.desktop).sort((a, b) => a.order - b.order);
export const mobileDock = [0, 1].map((page) => navigationRegistry.filter((item) => item.mobileDockPage === page).sort((a, b) => (a.mobileOrder ?? a.order) - (b.mobileOrder ?? b.order))) as [NavigationDestination[], NavigationDestination[]];

export function runRouteCleanup(callbacks: Array<() => void>) {
  callbacks.forEach((callback) => callback());
}
