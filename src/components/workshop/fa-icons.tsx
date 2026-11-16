import { type ComponentType } from "react";
import {
  AlertCircle as LucideAlertCircle,
  Archive as LucideArchive,
  ArrowDown as LucideArrowDown,
  ArrowLeft as LucideArrowLeft,
  ArrowRight as LucideArrowRight,
  ArrowUp as LucideArrowUp,
  ArrowUpDown as LucideArrowUpDown,
  ArrowUpRight as LucideArrowUpRight,
  Bell as LucideBell,
  Briefcase as LucideBriefcase,
  Calendar as LucideCalendar,
  Camera as LucideCamera,
  Car as LucideCar,
  BarChart3 as LucideBarChart3,
  Check as LucideCheck,
  CheckCircle2 as LucideCheckCircle2,
  ChevronDown as LucideChevronDown,
  ChevronRight as LucideChevronRight,
  ClipboardCheck as LucideClipboardCheck,
  ClipboardList as LucideClipboardList,
  Clock as LucideClock,
  Copy as LucideCopy,
  Download as LucideDownload,
  Eye as LucideEye,
  EyeOff as LucideEyeOff,
  FileText as LucideFileText,
  FolderOpen as LucideFolderOpen,
  GitBranch as LucideGitBranch,
  Key as LucideKey,
  LayoutDashboard as LucideLayoutDashboard,
  Loader2 as LucideLoader2,
  Lock as LucideLock,
  LogOut as LucideLogOut,
  Mail as LucideMail,
  Menu as LucideMenu,
  MessageSquare as LucideMessageSquare,
  Mic as LucideMic,
  MicOff as LucideMicOff,
  Monitor as LucideMonitor,
  Moon as LucideMoon,
  Package as LucidePackage,
  Plus as LucidePlus,
  Printer as LucidePrinter,
  RotateCcw as LucideRotateCcw,
  Save as LucideSave,
  Search as LucideSearch,
  Send as LucideSend,
  Settings as LucideSettings,
  Shield as LucideShield,
  ShieldCheck as LucideShieldCheck,
  Sliders as LucideSliders,
  Sparkles as LucideSparkles,
  StickyNote as LucideStickyNote,
  Sun as LucideSun,
  Trash2 as LucideTrash2,
  Truck as LucideTruck,
  Upload as LucideUpload,
  User as LucideUser,
  UserCheck as LucideUserCheck,
  Bot as LucideBot,
  Wrench as LucideWrench,
  X as LucideX,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FaIconProps {
  size?: number;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}

export type FaIconType = ComponentType<FaIconProps>;

const SIZE_MAP: Record<number, number> = {
  10: 12,
  11: 13,
  12: 14,
  13: 15,
  14: 16,
  15: 17,
  16: 18,
  18: 20,
  19: 20,
  20: 22,
  22: 24,
  23: 24,
  24: 26,
};

function createLucideIcon(LucideComponent: typeof LucideAlertCircle): FaIconType {
  return function CrispLucideIcon({
    size = 16,
    className,
    "aria-hidden": ariaHidden,
  }: FaIconProps) {
    const pxSize = SIZE_MAP[size] ?? size;
    return (
      <LucideComponent
        size={pxSize}
        strokeWidth={1.75}
        aria-hidden={ariaHidden}
        className={cn("shrink-0 transition-transform duration-150", className)}
      />
    );
  };
}

export const AlertCircle = createLucideIcon(LucideAlertCircle);
export const Archive = createLucideIcon(LucideArchive);
export const ArrowDown = createLucideIcon(LucideArrowDown);
export const ArrowLeft = createLucideIcon(LucideArrowLeft);
export const ArrowRight = createLucideIcon(LucideArrowRight);
export const ArrowUp = createLucideIcon(LucideArrowUp);
export const ArrowUpDown = createLucideIcon(LucideArrowUpDown);
export const ArrowUpRight = createLucideIcon(LucideArrowUpRight);
export const Bell = createLucideIcon(LucideBell);
export const Briefcase = createLucideIcon(LucideBriefcase);
export const CalendarDays = createLucideIcon(LucideCalendar);
export const Camera = createLucideIcon(LucideCamera);
export const Car = createLucideIcon(LucideCar);
export const ChartNoAxesColumnIncreasing = createLucideIcon(LucideBarChart3);
export const Check = createLucideIcon(LucideCheck);
export const CheckCircle2 = createLucideIcon(LucideCheckCircle2);
export const ChevronDown = createLucideIcon(LucideChevronDown);
export const ChevronRight = createLucideIcon(LucideChevronRight);
export const ClipboardCheck = createLucideIcon(LucideClipboardCheck);
export const ClipboardList = createLucideIcon(LucideClipboardList);
export const Clock = createLucideIcon(LucideClock);
export const Copy = createLucideIcon(LucideCopy);
export const Download = createLucideIcon(LucideDownload);
export const Eye = createLucideIcon(LucideEye);
export const EyeOff = createLucideIcon(LucideEyeOff);
export const FileText = createLucideIcon(LucideFileText);
export const FolderOpen = createLucideIcon(LucideFolderOpen);
export const GitBranch = createLucideIcon(LucideGitBranch);
export const KeyRound = createLucideIcon(LucideKey);
export const LayoutDashboard = createLucideIcon(LucideLayoutDashboard);
export const Loader2 = createLucideIcon(LucideLoader2);
export const Lock = createLucideIcon(LucideLock);
export const LogOut = createLucideIcon(LucideLogOut);
export const Mail = createLucideIcon(LucideMail);
export const Menu = createLucideIcon(LucideMenu);
export const MessageSquare = createLucideIcon(LucideMessageSquare);
export const Mic = createLucideIcon(LucideMic);
export const MicOff = createLucideIcon(LucideMicOff);
export const Monitor = createLucideIcon(LucideMonitor);
export const Moon = createLucideIcon(LucideMoon);
export const Package = createLucideIcon(LucidePackage);
export const Plus = createLucideIcon(LucidePlus);
export const Printer = createLucideIcon(LucidePrinter);
export const RotateCcw = createLucideIcon(LucideRotateCcw);
export const Save = createLucideIcon(LucideSave);
export const Search = createLucideIcon(LucideSearch);
export const Send = createLucideIcon(LucideSend);
export const Settings = createLucideIcon(LucideSettings);
export const Shield = createLucideIcon(LucideShield);
export const ShieldCheck = createLucideIcon(LucideShieldCheck);
export const SlidersHorizontal = createLucideIcon(LucideSliders);
export const Sparkles = createLucideIcon(LucideSparkles);
export const StickyNote = createLucideIcon(LucideStickyNote);
export const Sun = createLucideIcon(LucideSun);
export const Trash2 = createLucideIcon(LucideTrash2);
export const Truck = createLucideIcon(LucideTruck);
export const Upload = createLucideIcon(LucideUpload);
export const User = createLucideIcon(LucideUser);
export const UserCheck = createLucideIcon(LucideUserCheck);
export const UserRound = createLucideIcon(LucideUser);
export const Bot = createLucideIcon(LucideBot);
export const Wrench = createLucideIcon(LucideWrench);
export const X = createLucideIcon(LucideX);
