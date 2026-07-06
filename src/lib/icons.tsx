import {
  Home,
  ShoppingCart,
  Zap,
  Car,
  Shield,
  HeartPulse,
  UtensilsCrossed,
  Film,
  ShoppingBag,
  Repeat,
  Plane,
  LifeBuoy,
  TrendingUp,
  CreditCard,
  Target,
  Wallet,
  Landmark,
  PiggyBank,
  Building2,
  Gem,
  Bitcoin,
  LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  Home,
  ShoppingCart,
  Zap,
  Car,
  Shield,
  HeartPulse,
  UtensilsCrossed,
  Film,
  ShoppingBag,
  Repeat,
  Plane,
  LifeBuoy,
  TrendingUp,
  CreditCard,
  Target,
  Landmark,
  PiggyBank,
  Building2,
  Gem,
};

export function CategoryIcon({ name, size = 16 }: { name?: string; size?: number }) {
  const Icon = (name && ICONS[name]) || Wallet;
  return <Icon size={size} />;
}

export const ASSET_TYPE_ICON: Record<string, LucideIcon> = {
  cash: Wallet,
  investment: TrendingUp,
  property: Building2,
  crypto: Bitcoin,
  other: Gem,
};
