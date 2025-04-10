/**
 * Extracts the YAML front matter block from a markdown string.
 * Returns an object with:
 *   - frontMatter: the raw YAML text (if found)
 *   - content: the markdown after the YAML header.
 */
function extractFrontMatter(markdown) {
  const match = markdown.match(/^---\s*([\s\S]*?)\s*---\s*/);
  if (match) {
    return {
      frontMatter: match[1],
      content: markdown.slice(match[0].length),
    };
  }
  return { frontMatter: null, content: markdown };
}

function extractTitleFromYAML(yaml) {
  const titleMatch = yaml?.match(/title:\s*(.+)/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

function extractDateFromYAML(yaml) {
  const dateMatch = yaml?.match(/date:\s*(.+)/i);
  return dateMatch ? dateMatch[1].trim() : null;
}

function extractModifiedFromYAML(yaml) {
  const modMatch = yaml?.match(/modified:\s*(.+)/i);
  return modMatch ? modMatch[1].trim() : null;
}

function cleanMarkdown(markdown) {
  const { content } = extractFrontMatter(markdown);
  return content.replace(/^---\s*/, "").trim();
}

function generateTOC(htmlContent) {
  const headingRegex = /<(h[2-4])>(.*?)<\/\1>/gi;
  let tocRows = "";
  let match;
  let updatedContent = htmlContent;

  while ((match = headingRegex.exec(htmlContent)) !== null) {
    const tag = match[1];
    const title = match[2];
    let id = title.toLowerCase().trim().replace(/[^\w]+/g, "-");
    const headingWithId = `<${tag} id="${id}">${title}</${tag}>`;
    updatedContent = updatedContent.replace(match[0], headingWithId);
    tocRows += `<tr><td><a href="#${id}">${title}</a></td></tr>`;
  }

  const toc = `
    <table class="table-of-contents">
      <thead>
        <tr><th>Contents</th></tr>
      </thead>
      <tbody>
        ${tocRows}
      </tbody>
    </table>`;

  return { toc, content: updatedContent };
}

export {
  extractFrontMatter,
  extractTitleFromYAML,
  extractDateFromYAML,
  extractModifiedFromYAML,
  cleanMarkdown,
  generateTOC,
};
