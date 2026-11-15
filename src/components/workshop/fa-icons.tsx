import { type ComponentType } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowDown,
  faArrowRight,
  faArrowUp,
  faArrowUpRightFromSquare,
  faBars,
  faBell,
  faBoxArchive,
  faBoxesStacked,
  faBriefcase,
  faCalendarDays,
  faCamera,
  faCar,
  faChartColumn,
  faCheck,
  faChevronDown,
  faChevronRight,
  faCircleCheck,
  faCircleExclamation,
  faClipboardCheck,
  faClipboardList,
  faClock,
  faCodeBranch,
  faCommentDots,
  faCopy,
  faDesktop,
  faDownload,
  faEnvelope,
  faEye,
  faEyeSlash,
  faFileLines,
  faFloppyDisk,
  faFolderOpen,
  faGear,
  faKey,
  faLock,
  faMagnifyingGlass,
  faMoon,
  faNoteSticky,
  faPaperPlane,
  faPlus,
  faPrint,
  faRightFromBracket,
  faRotateLeft,
  faShield,
  faShieldHalved,
  faSliders,
  faSort,
  faSpinner,
  faSun,
  faTableCellsLarge,
  faTrash,
  faTruck,
  faUpload,
  faUser,
  faUserCheck,
  faWandMagicSparkles,
  faWrench,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";

export interface FaIconProps {
  size?: number;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}

export type FaIconType = ComponentType<FaIconProps>;

const SIZE_CLASSES: Record<number, string> = {
  10: "text-[10px]",
  11: "text-[11px]",
  12: "text-xs",
  13: "text-[13px]",
  14: "text-sm",
  15: "text-[15px]",
  16: "text-base",
  18: "text-lg",
  19: "text-[19px]",
  20: "text-xl",
  22: "text-[22px]",
  23: "text-[23px]",
  24: "text-2xl",
};

function createSolidIcon(icon: IconDefinition): FaIconType {
  return function SolidFaIcon({ size, className, "aria-hidden": ariaHidden }: FaIconProps) {
    const sizeClass = size ? SIZE_CLASSES[size] : undefined;
    return (
      <FontAwesomeIcon
        icon={icon}
        fixedWidth
        aria-hidden={ariaHidden}
        className={cn(sizeClass, className)}
      />
    );
  };
}

export const AlertCircle = createSolidIcon(faCircleExclamation);
export const Archive = createSolidIcon(faBoxArchive);
export const ArrowDown = createSolidIcon(faArrowDown);
export const ArrowRight = createSolidIcon(faArrowRight);
export const ArrowUp = createSolidIcon(faArrowUp);
export const ArrowUpDown = createSolidIcon(faSort);
export const ArrowUpRight = createSolidIcon(faArrowUpRightFromSquare);
export const Bell = createSolidIcon(faBell);
export const Briefcase = createSolidIcon(faBriefcase);
export const CalendarDays = createSolidIcon(faCalendarDays);
export const Camera = createSolidIcon(faCamera);
export const Car = createSolidIcon(faCar);
export const ChartNoAxesColumnIncreasing = createSolidIcon(faChartColumn);
export const Check = createSolidIcon(faCheck);
export const CheckCircle2 = createSolidIcon(faCircleCheck);
export const ChevronDown = createSolidIcon(faChevronDown);
export const ChevronRight = createSolidIcon(faChevronRight);
export const ClipboardCheck = createSolidIcon(faClipboardCheck);
export const ClipboardList = createSolidIcon(faClipboardList);
export const Clock = createSolidIcon(faClock);
export const Copy = createSolidIcon(faCopy);
export const Download = createSolidIcon(faDownload);
export const Eye = createSolidIcon(faEye);
export const EyeOff = createSolidIcon(faEyeSlash);
export const FileText = createSolidIcon(faFileLines);
export const FolderOpen = createSolidIcon(faFolderOpen);
export const GitBranch = createSolidIcon(faCodeBranch);
export const KeyRound = createSolidIcon(faKey);
export const LayoutDashboard = createSolidIcon(faTableCellsLarge);
export const Loader2 = createSolidIcon(faSpinner);
export const Lock = createSolidIcon(faLock);
export const LogOut = createSolidIcon(faRightFromBracket);
export const Mail = createSolidIcon(faEnvelope);
export const Menu = createSolidIcon(faBars);
export const MessageSquare = createSolidIcon(faCommentDots);
export const Monitor = createSolidIcon(faDesktop);
export const Moon = createSolidIcon(faMoon);
export const Package = createSolidIcon(faBoxesStacked);
export const Plus = createSolidIcon(faPlus);
export const Printer = createSolidIcon(faPrint);
export const RotateCcw = createSolidIcon(faRotateLeft);
export const Save = createSolidIcon(faFloppyDisk);
export const Search = createSolidIcon(faMagnifyingGlass);
export const Send = createSolidIcon(faPaperPlane);
export const Settings = createSolidIcon(faGear);
export const Shield = createSolidIcon(faShield);
export const ShieldCheck = createSolidIcon(faShieldHalved);
export const SlidersHorizontal = createSolidIcon(faSliders);
export const Sparkles = createSolidIcon(faWandMagicSparkles);
export const StickyNote = createSolidIcon(faNoteSticky);
export const Sun = createSolidIcon(faSun);
export const Trash2 = createSolidIcon(faTrash);
export const Truck = createSolidIcon(faTruck);
export const Upload = createSolidIcon(faUpload);
export const User = createSolidIcon(faUser);
export const UserCheck = createSolidIcon(faUserCheck);
export const UserRound = createSolidIcon(faUser);
export const Wrench = createSolidIcon(faWrench);
export const X = createSolidIcon(faXmark);
