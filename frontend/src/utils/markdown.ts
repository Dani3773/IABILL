export function renderMarkdown(text: string): string {
  const lines = text.split("\n");
  let html = "";
  let inList = false;

  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const applyInline = (s: string) => {
    let escaped = escapeHtml(s);
    escaped = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    escaped = escaped.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, "<em>$1</em>");
    return escaped;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line === "") {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      continue;
    }
    if (line.startsWith("* ") || line.startsWith("- ")) {
      if (!inList) {
        html += "<ul class='list-disc pl-5 space-y-1'>";
        inList = true;
      }
      html += `<li>${applyInline(line.slice(2).trim())}</li>`;
      continue;
    }
    if (inList) {
      html += "</ul>";
      inList = false;
    }
    if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
      html += `<h3 class="font-semibold text-[#1B2233] mt-3 mb-1">${escapeHtml(line.slice(2, -2).trim())}</h3>`;
    } else if (line === "---") {
      html += '<hr class="my-2 border-[#1B2233]/10" />';
    } else {
      html += `<p class="mb-2">${applyInline(line)}</p>`;
    }
  }
  if (inList) html += "</ul>";
  return html;
}