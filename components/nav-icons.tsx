import {
  Award,
  Briefcase,
  Building2,
  CalendarDays,
  CreditCard,
  FolderClosed,
  Gauge,
  Headset,
  HelpCircle,
  Home,
  Lock,
  MessageSquare,
  Newspaper,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Les définitions de navigation transitent du serveur vers le client, donc les
 * icônes y sont des chaînes. C'est ici qu'elles redeviennent des composants.
 */
export const NAV_ICONS: Record<string, LucideIcon> = {
  home: Home,
  building: Building2,
  award: Award,
  users: Users,
  calendar: CalendarDays,
  news: Newspaper,
  chat: MessageSquare,
  folder: FolderClosed,
  gauge: Gauge,
  card: CreditCard,
  briefcase: Briefcase,
  help: HelpCircle,
  support: Headset,
  lock: Lock,
};
