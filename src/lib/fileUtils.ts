import { format } from "date-fns";

export const handleFileView = (fileUrl: string | undefined) => {
  if (!fileUrl) {
    console.error("File URL is undefined");
    return;
  }
  
  try {
    const newWindow = window.open(fileUrl, "_blank", "noopener,noreferrer");
    
    if (!newWindow) {
      console.error("Unable to open file. Check popup blocker settings.");
      return;
    }
    
    if (newWindow.opener) {
      newWindow.opener = null;
    }
  } catch (error) {
    console.error("Error viewing file:", error);
  }
};

export const handleFileDownload = (fileUrl: string | undefined, fileName: string) => {
  if (!fileUrl) {
    console.error("File URL is undefined");
    return;
  }
  
  try {
    const link = document.createElement("a");
    
    if (fileUrl.startsWith('blob:') || fileUrl.startsWith('http')) {
      link.href = fileUrl;
    } else {
      console.error("Invalid file URL format:", fileUrl);
      return;
    }
    
    link.download = fileName;
    link.rel = "noopener noreferrer";
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  } catch (error) {
    console.error("Error downloading file:", error);
  }
};

export const formatDate = (date: Date | string | null): string => {
  if (!date) return "Not specified";
  try {
    if (date instanceof Date) {
      return format(date, "MMM d, yyyy");
    }
    return format(new Date(date), "MMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};
