import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const modes = [
  { id: "hybrid", name: "混合模式", icon: "🧠" },
  { id: "tutor", name: "導師型", icon: "👨‍🏫" },
  { id: "engineer", name: "工程師型", icon: "🛠️" },
  { id: "analyst", name: "分析師型", icon: "🔍" },
];
