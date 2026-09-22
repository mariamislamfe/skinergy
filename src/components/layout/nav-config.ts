import {
  Home,
  ScanLine,
  Flame,
  MessageCircle,
  History,
  User,
  LayoutDashboard,
  Users,
  Cpu,
  FileText,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const personalNav: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Scan", href: "/scan", icon: ScanLine },
  { label: "My Burn", href: "/my-burn", icon: Flame },
  { label: "AI Assistant", href: "/chat", icon: MessageCircle },
  { label: "History", href: "/history", icon: History },
  { label: "Profile", href: "/profile", icon: User },
];

export const healthcareNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Patients", href: "/patients", icon: Users },
  { label: "Scan", href: "/scan", icon: ScanLine },
  { label: "Devices", href: "/devices", icon: Cpu },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Profile", href: "/profile", icon: User },
];
