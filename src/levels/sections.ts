import { Section } from "@/types";

export interface SectionInfo {
  id: Section;
  title: string;
  story: string;
  icon: string;
}

export const SECTIONS: SectionInfo[] = [
  { id: "basics", title: "Основы", story: "Первый день: настраиваем рабочее место", icon: "📁" },
  { id: "branching", title: "Ветвление", story: "Первая задача: работаем над фичей", icon: "🌿" },
  { id: "remote", title: "Удалённые репо", story: "Подключаемся к команде", icon: "🌐" },
  { id: "github", title: "GitHub", story: "Первый Pull Request", icon: "🐙" },
  { id: "advanced", title: "Продвинутое", story: "Что-то пошло не так — спасаем ситуацию", icon: "🔧" },
  { id: "teamwork", title: "Командная работа", story: "Релиз: работаем вместе", icon: "👥" },
  { id: "internals", title: "Git internals", story: "Бонус: заглядываем под капот", icon: "⚙️" },
];
