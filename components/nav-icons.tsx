import {
  Award,
  BookUser,
  Briefcase,
  Building2,
  CalendarDays,
  CalendarClock,
  CalendarRange,
  CreditCard,
  FolderClosed,
  Gauge,
  Headset,
  HelpCircle,
  History,
  Home,
  Lock,
  MessageSquare,
  Newspaper,
  ShieldCheck,
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
  annuaire: BookUser,
  calendar: CalendarDays,
  agenda: CalendarRange,
  rendezvous: CalendarClock,
  news: Newspaper,
  chat: MessageSquare,
  folder: FolderClosed,
  gauge: Gauge,
  card: CreditCard,
  briefcase: Briefcase,
  help: HelpCircle,
  history: History,
  support: Headset,
  shield: ShieldCheck,
  lock: Lock,
};
