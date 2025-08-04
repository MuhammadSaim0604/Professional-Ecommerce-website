import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export default function FloatingThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="md:hidden fixed bottom-20 right-4 z-40">
      <Button
        variant="outline"
        size="icon"
        className="w-12 h-12 rounded-full shadow-lg bg-white dark:bg-gray-800 border-2"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        {theme === "light" ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}