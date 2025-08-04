import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface EditorSettings {
  id: number;
  heroImage?: string;
  siteLogo?: string;
  favicon?: string;
  siteName?: string;
  footerEmail?: string;
  footerAddress?: string;
  footerPhone?: string;
  facebookLink?: string;
  twitterLink?: string;
  instagramLink?: string;
  linkedinLink?: string;
}

export function useFavicon() {
  const { data: editorSettings } = useQuery<EditorSettings>({
    queryKey: ["/api/editor-settings"],
  });

  useEffect(() => {
    if (editorSettings?.favicon) {
      // Remove existing favicon links
      const existingLinks = document.querySelectorAll('link[rel*="icon"]');
      existingLinks.forEach(link => link.remove());

      // Add new favicon link
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/x-icon';
      link.href = editorSettings.favicon;
      document.head.appendChild(link);
    }
  }, [editorSettings?.favicon]);
}