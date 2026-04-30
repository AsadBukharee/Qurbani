import { useContext } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";
import colors from "@/constants/colors";

export function useColors() {
  const ctx = useContext(ThemeContext);
  const palette = ctx.theme === "dark" ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
