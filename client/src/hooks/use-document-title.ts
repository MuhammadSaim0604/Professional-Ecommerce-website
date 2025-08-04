import { useEffect } from "react";
import { useSiteName } from "./use-site-name";

export function useDocumentTitle(title?: string) {
  const siteName = useSiteName();
  
  useEffect(() => {
    if (title) {
      document.title = `${title} | ${siteName}`;
    } else {
      document.title = siteName;
    }
  }, [title, siteName]);
}