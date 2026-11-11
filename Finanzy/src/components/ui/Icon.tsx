import ArrowDown from 'lucide-react-native/icons/arrow-down';
import Banknote from 'lucide-react-native/icons/banknote';
import Bell from 'lucide-react-native/icons/bell';
import BookOpen from 'lucide-react-native/icons/book-open';
import BriefcaseBusiness from 'lucide-react-native/icons/briefcase-business';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import Car from 'lucide-react-native/icons/car';
import ChartNoAxesCombined from 'lucide-react-native/icons/chart-no-axes-combined';
import ChartPie from 'lucide-react-native/icons/chart-pie';
import Check from 'lucide-react-native/icons/check';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Coffee from 'lucide-react-native/icons/coffee';
import CreditCard from 'lucide-react-native/icons/credit-card';
import FileText from 'lucide-react-native/icons/file-text';
import Gamepad2 from 'lucide-react-native/icons/gamepad-2';
import Gift from 'lucide-react-native/icons/gift';
import Heart from 'lucide-react-native/icons/heart';
import House from 'lucide-react-native/icons/house';
import Laptop from 'lucide-react-native/icons/laptop';
import LogOut from 'lucide-react-native/icons/log-out';
import Menu from 'lucide-react-native/icons/menu';
import MoreHorizontal from 'lucide-react-native/icons/ellipsis';
import Package from 'lucide-react-native/icons/package';
import PawPrint from 'lucide-react-native/icons/paw-print';
import Plane from 'lucide-react-native/icons/plane';
import Receipt from 'lucide-react-native/icons/receipt';
import RefreshCw from 'lucide-react-native/icons/refresh-cw';
import Settings from 'lucide-react-native/icons/settings';
import ShoppingCart from 'lucide-react-native/icons/shopping-cart';
import Star from 'lucide-react-native/icons/star';
import Tags from 'lucide-react-native/icons/tags';
import Target from 'lucide-react-native/icons/target';
import TrendingUp from 'lucide-react-native/icons/trending-up';
import Undo2 from 'lucide-react-native/icons/undo-2';
import Utensils from 'lucide-react-native/icons/utensils';
import Wallet from 'lucide-react-native/icons/wallet';
import { normalizeIcon } from '../../domain/icons';
import { useTheme } from '../../theme/ThemeProvider';

const icons = {
  'arrow-down': ArrowDown, banknote: Banknote, bell: Bell, 'book-open': BookOpen,
  briefcase: BriefcaseBusiness, calendar: CalendarDays, car: Car, chart: ChartNoAxesCombined,
  'chart-pie': ChartPie, check: Check, 'chevron-right': ChevronRight, coffee: Coffee,
  'credit-card': CreditCard, 'file-text': FileText, gamepad: Gamepad2, gift: Gift, heart: Heart,
  house: House, laptop: Laptop, logout: LogOut, menu: Menu, more: MoreHorizontal, package: Package,
  'paw-print': PawPrint, plane: Plane, receipt: Receipt, refresh: RefreshCw, settings: Settings,
  'shopping-cart': ShoppingCart, star: Star, tags: Tags, target: Target, 'trending-up': TrendingUp,
  undo: Undo2, utensils: Utensils, wallet: Wallet,
};

export function Icon({ name, size = 20, color }: { name?: string | null; size?: number; color?: string }) {
  const { theme } = useTheme();
  const key = name && Object.hasOwn(icons, name) ? name as keyof typeof icons : normalizeIcon(name);
  const Component = icons[key];
  return <Component aria-hidden color={color ?? theme.colors.primaryStrong} size={size} strokeWidth={1.8} />;
}
