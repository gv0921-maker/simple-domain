// Icon mapping utility for dynamic icon loading

import {
  MessageSquare, LayoutDashboard, Package, Factory, Smartphone,
  Barcode, Layers, Users, Grid3X3, Settings, ShoppingCart,
  FileText, DollarSign, Wrench, CalendarDays, HelpCircle,
  Mail, Globe, Home, Heart, Star, Zap, Shield, Briefcase,
  Building, Truck, Box, Archive, Database, Server, Cloud,
  Cpu, Monitor, Printer, Phone, Tablet, Watch, Camera,
  Video, Music, Image, File, Folder, Clipboard, Book,
  Bookmark, Flag, Tag, Award, Trophy, Target, Activity,
  TrendingUp,
  LucideIcon,
} from 'lucide-react';
import { IconName } from './types';

const iconMap: Record<IconName, LucideIcon> = {
  MessageSquare,
  LayoutDashboard,
  Package,
  Factory,
  Smartphone,
  Barcode,
  Layers,
  Users,
  Grid3X3,
  Settings,
  ShoppingCart,
  FileText,
  DollarSign,
  Wrench,
  CalendarDays,
  HelpCircle,
  Mail,
  Globe,
  Home,
  Heart,
  Star,
  Zap,
  Shield,
  Briefcase,
  Building,
  Truck,
  Box,
  Archive,
  Database,
  Server,
  Cloud,
  Cpu,
  Monitor,
  Printer,
  Phone,
  Tablet,
  Watch,
  Camera,
  Video,
  Music,
  Image,
  File,
  Folder,
  Clipboard,
  Book,
  Bookmark,
  Flag,
  Tag,
  Award,
  Trophy,
  Target,
  Activity,
};

export function getIcon(name: IconName): LucideIcon {
  return iconMap[name] || Package;
}

export function getAllIcons(): { name: IconName; icon: LucideIcon }[] {
  return Object.entries(iconMap).map(([name, icon]) => ({
    name: name as IconName,
    icon,
  }));
}
