import { Moon, Sun } from "lucide-react";

export default function ThemeSelector({ theme, onThemeChange }) {
  const nextTheme = theme === "dark" ? "light" : "dark";
  const CurrentIcon = theme === "dark" ? Sun : Moon;

  return (
    <button
      className="theme-selector-trigger"
      onClick={() => onThemeChange(nextTheme)}
      aria-label={`Mudar para modo ${nextTheme === "dark" ? "escuro" : "claro"}`}
      title={`Modo ${theme === "dark" ? "Escuro" : "Claro"}`}
    >
      <CurrentIcon size={20} />
    </button>
  );
}
