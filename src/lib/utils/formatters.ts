export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getFileCategory(mimeType: string, fileName: string): string {
  const lowerName = fileName.toLowerCase();
  if (mimeType.includes("pdf") || lowerName.endsWith(".pdf")) {
    return "pdf";
  }
  if (/\.(md|markdown)$/.test(lowerName)) {
    return "markdown";
  }
  if (/\.(html|htm)$/.test(lowerName) || mimeType.includes("html")) {
    return "html";
  }
  if (
    mimeType.includes("presentation") ||
    mimeType.includes("powerpoint") ||
    /\.(ppt|pptx|key|odp)$/.test(lowerName)
  ) {
    return "presentation";
  }
  if (
    mimeType.includes("sheet") ||
    mimeType.includes("excel") ||
    /\.(xls|xlsx|csv|ods)$/.test(lowerName)
  ) {
    return "spreadsheet";
  }
  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    /\.(doc|docx|odt|rtf|txt)$/.test(lowerName)
  ) {
    return "document";
  }
  if (mimeType.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/.test(lowerName)) {
    return "image";
  }
  if (mimeType.startsWith("video/") || /\.(mp4|webm|mkv|mov|avi|flv)$/.test(lowerName)) {
    return "video";
  }
  if (mimeType.startsWith("audio/") || /\.(mp3|wav|ogg|flac|m4a|aac)$/.test(lowerName)) {
    return "audio";
  }
  if (
    mimeType.includes("zip") ||
    mimeType.includes("compressed") ||
    mimeType.includes("tar") ||
    /\.(zip|rar|7z|tar|gz)$/.test(lowerName)
  ) {
    return "archive";
  }
  if (/\.(drawio|sketch|fig|xd)$/.test(lowerName)) {
    return "drawing";
  }
  if (/\.(js|ts|jsx|tsx|py|java|c|cpp|cs|go|rs|php|css|json)$/.test(lowerName)) {
    return "code";
  }
  return "other";
}
