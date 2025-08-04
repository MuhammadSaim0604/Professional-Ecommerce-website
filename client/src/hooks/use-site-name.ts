import { useQuery } from "@tanstack/react-query";

interface EditorSettings {
  id: number;
  siteName?: string;
}

export function useSiteName() {
  const { data: editorSettings } = useQuery<EditorSettings>({
    queryKey: ["/api/editor-settings"],
  });

  return editorSettings?.siteName || "EcomStore";
}