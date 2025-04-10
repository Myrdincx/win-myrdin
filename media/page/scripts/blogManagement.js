import { blogsWindow, blogsList } from "./domElements.js";
import { extractFrontMatter, generateTOC } from "./utilities.js";


let blogFiles = []; // Stores blog filenames

function loadBlogManifest() {
  fetch("blogs/blogs.json?_=" + new Date().getTime())
    .then((response) => {
      if (!response.ok) throw new Error("Failed to load blog manifest.");
      return response.json();
    })
    .then((data) => {
      blogFiles = data.map((filename) => "blogs/" + filename);
      renderBlogsList();
    })
    .catch((err) => console.error("Error loading blog manifest:", err));
}

function renderBlogsList() {
  blogsList.innerHTML = "";
  const promises = blogFiles.map((file) =>
    fetch(file + "?_=" + new Date().getTime())
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load blog: " + file);
        return response.text();
      })
      .then((markdown) => {
        const { frontMatter } = extractFrontMatter(markdown);
        const title = extractTitleFromYAML(frontMatter) || file;
        const date = extractDateFromYAML(frontMatter) || "";
        const modified = extractModifiedFromYAML(frontMatter) || "";
        return { file, title, date, modified };
      })
      .catch((err) => {
        console.error(err);
        return { file, title: file, date: "", modified: "" };
      })
  );

  Promise.all(promises).then((results) => {
    results.sort((a, b) => new Date(a.date) - new Date(b.date));
    results.forEach((blog) => {
      const li = document.createElement("li");
      let displayText = blog.title;
      if (blog.date) {
        displayText += " (" + blog.date;
        if (blog.modified) displayText += ", mod.: " + blog.modified;
        displayText += ")";
      }
      li.textContent = displayText;
      li.addEventListener("click", () => loadBlog(blog.file));
      blogsList.appendChild(li);
    });
  });
}

function loadBlog(blogFile) {
  fetch(blogFile + "?_=" + new Date().getTime())
    .then((response) => {
      if (!response.ok) throw new Error("Failed to load blog: " + blogFile);
      return response.text();
    })
    .then((markdown) => {
      const cleanedContent = cleanMarkdown(markdown);
      const htmlContent = marked.parse(cleanedContent);
      const { toc, content } = generateTOC(htmlContent);

      blogsWindow.innerHTML = `
        <div class="title-bar">
          <div class="title-bar-text">${blogFile}</div>
          <div class="title-bar-controls">
            <button onclick="openBlogs()">←</button>
            <button onclick="toggleMaximize()">[ ]</button>
            <button onclick="closeBlogs()">×</button>
          </div>
        </div>
        <div class="window-body">
          ${toc}
          ${content}
        </div>`;
    })
    .catch((error) => console.error(error));
}

export { loadBlogManifest, renderBlogsList, loadBlog };
