// ====================
//  Utility Functions
// ====================

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
      content: markdown.slice(match[0].length)
    };
  }
  return { frontMatter: null, content: markdown };
}

/**
 * Extracts the title from a YAML front matter string.
 */
function extractTitleFromYAML(yaml) {
  if (!yaml) return null;
  const titleMatch = yaml.match(/title:\s*(.+)/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

/**
 * Extracts the date from a YAML front matter string.
 */
function extractDateFromYAML(yaml) {
  if (!yaml) return null;
  const dateMatch = yaml.match(/date:\s*(.+)/i);
  return dateMatch ? dateMatch[1].trim() : null;
}

/**
 * Extracts the modified date from a YAML front matter string.
 */
function extractModifiedFromYAML(yaml) {
  if (!yaml) return null;
  const modMatch = yaml.match(/modified:\s*(.+)/i);
  return modMatch ? modMatch[1].trim() : null;
}

/**
 * Convenience function to extract the title from markdown,
 * falling back to the filename if no title is available.
 */
function extractTitle(markdown, fallback) {
  const { frontMatter } = extractFrontMatter(markdown);
  const title = extractTitleFromYAML(frontMatter);
  return title || fallback;
}

/**
 * Cleans the markdown content by removing extra separators.
 */
function cleanMarkdown(markdown) {
  const { content } = extractFrontMatter(markdown);
  return content.replace(/^---\s*/, '').trim();
}

/**
 * Generates a Table of Contents (TOC) as an HTML table from the given HTML content.
 * It finds headings h2, h3, and h4, adds an id (if missing) to each,
 * and returns an object with:
 *   - toc: the generated TOC as an HTML table string.
 *   - content: the updated HTML content with heading IDs.
 */
function generateTOC(htmlContent) {
  const headingRegex = /<(h[2-4])>(.*?)<\/\1>/gi;
  let tocRows = "";
  let match;
  let updatedContent = htmlContent;
  
  while ((match = headingRegex.exec(htmlContent)) !== null) {
    const tag = match[1];      // e.g.: h2, h3, or h4
    const title = match[2];    
    let id = title.toLowerCase().trim().replace(/[^\w]+/g, '-');
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

// ====================
//  DOM Elements
// ====================

// Welcome Window Elements
const welcomeWindow = document.getElementById('welcomeWindow');
const welcomeTitleBar = document.getElementById('welcomeTitleBar');
const welcomeAppBtn = document.getElementById('welcomeAppBtn');
const closeButton = document.getElementById('closeBtn');
const minimizeBtn = document.getElementById('minimizeBtn');
const maximizeBtn = document.getElementById('maximizeBtn');

// Blogs Window Elements
const blogsWindow = document.getElementById('blogsWindow');
const blogsTitleBar = document.getElementById('blogsTitleBar');
const minimizeBlogsBtn = document.getElementById('minimizeBlogsBtn');
const maximizeBlogsBtn = document.getElementById('maximizeBlogsBtn');
const closeBlogsBtn = document.getElementById('closeBlogsBtn');
const blogsList = document.getElementById('blogsList');

// Blogs Taskbar Entry (for Blogs window)
const blogsAppBtn = document.getElementById('blogsAppBtn');

// Start Menu & Taskbar Elements
const startBtn = document.getElementById('startBtn');
const startMenu = document.getElementById('startMenu');

// ====================
//  Global Variable for Blog Files
// ====================
let blogFiles = [];  // Will be built from blogs.json

// ====================
//  Start Menu Behavior
// ====================
startBtn.addEventListener('click', (e) => {
  startMenu.style.display = (startMenu.style.display === 'block') ? 'none' : 'block';
  e.stopPropagation();
});
document.addEventListener('click', (e) => {
  if (!startMenu.contains(e.target) && e.target !== startBtn) {
    startMenu.style.display = 'none';
  }
});

// Placeholder functions for other entries:
function openAboutMe() { alert('About Me coming soon!'); }
function openContact() { alert('Contact coming soon!'); }
function openProjects() { alert('Projects coming soon!'); }

// Open Welcome window from Start Menu
function openWelcome() {
  welcomeWindow.style.display = 'block';
  welcomeAppBtn.style.display = 'flex';
  startMenu.style.display = 'none';
}

// ====================
//  Load Blog Manifest and Render Blogs List
// ====================
function loadBlogManifest() {
  fetch('blogs/blogs.json?_=' + new Date().getTime())
    .then(response => {
      if (!response.ok) throw new Error('Failed to load blog manifest.');
      return response.json();
    })
    .then(data => {
      blogFiles = data.map(filename => 'blogs/' + filename);
      renderBlogsList();
    })
    .catch(err => console.error("Error loading blog manifest:", err));
}

/**
 * Renders the list of blogs in the Blogs window.
 * Fetches each blog file, extracts title, date and modified date from YAML front matter,
 * sorts them from old to new, and displays as list items.
 */
function renderBlogsList() {
  blogsList.innerHTML = '';
  const promises = blogFiles.map(file =>
    fetch(file + '?_=' + new Date().getTime())
      .then(response => {
        if (!response.ok) throw new Error('Failed to load blog: ' + file);
        return response.text();
      })
      .then(markdown => {
        const { frontMatter } = extractFrontMatter(markdown);
        const title = extractTitleFromYAML(frontMatter) || file;
        const date = extractDateFromYAML(frontMatter) || "";
        const modified = extractModifiedFromYAML(frontMatter) || "";
        return { file, title, date, modified };
      })
      .catch(err => {
        console.error(err);
        return { file, title: file, date: "", modified: "" };
      })
  );
  Promise.all(promises).then(results => {
    results.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    results.forEach(blog => {
      const li = document.createElement('li');
      let displayText = blog.title;
      if (blog.date) {
        displayText += " (" + blog.date;
        if (blog.modified) {
          displayText += ", mod.: " + blog.modified;
        }
        displayText += ")";
      }
      li.textContent = displayText;
      li.addEventListener('click', () => {
        blogsWindow.style.display = 'none';
        loadBlog(blog.file);
      });
      blogsList.appendChild(li);
    });
  });
}

function openBlogs() {
  blogsWindow.style.display = 'block';
  startMenu.style.display = 'none';
  loadBlogManifest();
  blogsAppBtn.style.display = 'flex';
}

function closeBlogs() {
  blogsWindow.style.display = 'none';
  blogsAppBtn.style.display = 'none';
}

blogsAppBtn.addEventListener('click', () => {
  if (blogsWindow.style.display === 'none' || blogsWindow.style.display === '') {
    openBlogs();
  } else {
    blogsWindow.style.display = 'none';
  }
});

// ====================
//  Load Blog Post (Markdown) with TOC, "Back" and "Maximize" Buttons
// ====================
function loadBlog(blogFile) {
  fetch(blogFile + '?_=' + new Date().getTime())
    .then(response => {
      if (!response.ok) throw new Error('Failed to load blog: ' + blogFile);
      return response.text();
    })
    .then(markdown => {
      const cleanedContent = cleanMarkdown(markdown);
      const htmlContent = marked.parse(cleanedContent);
      const { toc, content } = generateTOC(htmlContent);
      
      const blogContentWindow = document.createElement('div');
      blogContentWindow.className = 'window';
      blogContentWindow.style.position = 'absolute';
      blogContentWindow.style.top = '0px';
      blogContentWindow.style.left = '0px';
      blogContentWindow.style.width = '100vw';
      blogContentWindow.style.height = 'calc(100vh - 2rem)';
      blogContentWindow.style.zIndex = '400';
      
      blogContentWindow.innerHTML = `
        <div class="title-bar">
          <div class="title-bar-text" style="font-size: 0.9rem;">${blogFile}</div>
          <div class="title-bar-controls">
            <button aria-label="Back" onclick="backToBlogs(this)">←</button>
            <button aria-label="Maximize" onclick="toggleMaximizeBlog(this)">[ ]</button>
            <button aria-label="Close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
          </div>
        </div>
        <div class="window-body" style="font-family: Arial, sans-serif; font-size: 1rem; line-height: 1.6; color: #333; overflow-y: auto; padding: 1rem;">
          ${toc}
          ${content}
        </div>
        <div class="resize-handles">
          <div class="resize-handle top-left"></div>
          <div class="resize-handle top"></div>
          <div class="resize-handle top-right"></div>
          <div class="resize-handle right"></div>
          <div class="resize-handle bottom-right"></div>
          <div class="resize-handle bottom"></div>
          <div class="resize-handle bottom-left"></div>
          <div class="resize-handle left"></div>
        </div>
      `;
      
      document.body.appendChild(blogContentWindow);
      blogContentWindow.classList.add('maximized');
      enableDragging(blogContentWindow, blogContentWindow.querySelector('.title-bar'));
      enableResizing(blogContentWindow);
    })
    .catch(error => console.error(error));
}

function backToBlogs(buttonElement) {
  const blogContentWindow = buttonElement.parentElement.parentElement.parentElement;
  blogContentWindow.remove();
  openBlogs();
}

function toggleMaximizeBlog(buttonElement) {
  const windowEl = buttonElement.parentElement.parentElement.parentElement;
  windowEl.classList.toggle('maximized');
}

// ====================
//  Generic Window Dragging (with Taskbar Constraint)
// ====================
function enableDragging(windowEl, titleBarEl) {
  let offsetX = 0, offsetY = 0, isDragging = false;
  titleBarEl.addEventListener('mousedown', (e) => {
    if (windowEl.classList.contains('maximized')) return;
    isDragging = true;
    offsetX = e.clientX - windowEl.offsetLeft;
    offsetY = e.clientY - windowEl.offsetTop;
  });
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      let newLeft = e.clientX - offsetX;
      let newTop = e.clientY - offsetY;
      
      // Prevent overlapping the taskbar.
      const taskbar = document.querySelector('.taskbar');
      const taskbarHeight = taskbar ? taskbar.getBoundingClientRect().height : 0;
      const maxTop = window.innerHeight - taskbarHeight - windowEl.offsetHeight;
      if (newTop > maxTop) newTop = maxTop;
      if (newTop < 0) newTop = 0;
      
      // Constrain horizontally within the viewport.
      if (newLeft < 0) newLeft = 0;
      if (newLeft + windowEl.offsetWidth > window.innerWidth) {
        newLeft = window.innerWidth - windowEl.offsetWidth;
      }
      
      windowEl.style.left = newLeft + 'px';
      windowEl.style.top = newTop + 'px';
    }
  });
  document.addEventListener('mouseup', () => { isDragging = false; });
}

// ====================
//  Generic Window Resizing (Any Direction with Taskbar Constraint)
// ====================
function enableResizing(windowEl) {
  let isResizing = false, currentDir = "";
  let lastX = 0, lastY = 0;
  const handles = windowEl.querySelectorAll('.resize-handle');
  handles.forEach(handle => {
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isResizing = true;
      lastX = e.clientX;
      lastY = e.clientY;
      if (handle.classList.contains("top-left")) currentDir = "top-left";
      else if (handle.classList.contains("top")) currentDir = "top";
      else if (handle.classList.contains("top-right")) currentDir = "top-right";
      else if (handle.classList.contains("right")) currentDir = "right";
      else if (handle.classList.contains("bottom-right")) currentDir = "bottom-right";
      else if (handle.classList.contains("bottom")) currentDir = "bottom";
      else if (handle.classList.contains("bottom-left")) currentDir = "bottom-left";
      else if (handle.classList.contains("left")) currentDir = "left";
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    });
  });
  
  function mouseMoveHandler(e) {
    if (!isResizing) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const rect = windowEl.getBoundingClientRect();
    let newLeft = rect.left;
    let newTop = rect.top;
    let newWidth = rect.width;
    let newHeight = rect.height;
    
    if (currentDir.includes("right")) {
      newWidth = rect.width + dx;
    }
    if (currentDir.includes("left")) {
      newWidth = rect.width - dx;
      newLeft = rect.left + dx;
    }
    if (currentDir.includes("bottom")) {
      newHeight = rect.height + dy;
    }
    if (currentDir.includes("top")) {
      newHeight = rect.height - dy;
      newTop = rect.top + dy;
    }

    // Constrain vertical resizing to avoid overlapping the taskbar.
    const taskbar = document.querySelector('.taskbar');
    const taskbarHeight = taskbar ? taskbar.getBoundingClientRect().height : 0;
    const maxBottom = window.innerHeight - taskbarHeight;
    if (newTop < 0) {
      newTop = 0;
    }
    if (newTop + newHeight > maxBottom) {
      newHeight = maxBottom - newTop;
    }
    
    if (newWidth > 100) {
      windowEl.style.width = newWidth + "px";
      windowEl.style.left = newLeft + "px";
    }
    if (newHeight > 50) {
      windowEl.style.height = newHeight + "px";
      windowEl.style.top = newTop + "px";
    }
    
    lastX = e.clientX;
    lastY = e.clientY;
  }
  
  function mouseUpHandler(e) {
    isResizing = false;
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
  }
}

// ====================
//  Enable Dragging/Resizing for Pre-existing Windows
// ====================
enableDragging(welcomeWindow, welcomeTitleBar);
enableResizing(welcomeWindow);
enableDragging(blogsWindow, blogsTitleBar);
enableResizing(blogsWindow);

// ====================
//  Welcome Window Controls
// ====================
welcomeAppBtn.addEventListener('click', () => {
  if (welcomeWindow.style.display === 'none' || welcomeWindow.style.display === '') {
    openWelcome();
  } else {
    welcomeWindow.style.display = 'none';
  }
});
closeButton.addEventListener('click', () => {
  welcomeWindow.style.display = 'none';
  welcomeAppBtn.style.display = 'none';
});
minimizeBtn.addEventListener('click', () => {
  welcomeWindow.style.display = 'none';
  welcomeAppBtn.style.display = 'flex';
});
maximizeBtn.addEventListener('click', () => {
  welcomeWindow.classList.toggle('maximized');
});

// ====================
//  Blogs Window Controls
// ====================
minimizeBlogsBtn.addEventListener('click', () => {
  blogsWindow.style.display = 'none';
});
maximizeBlogsBtn.addEventListener('click', () => {
  blogsWindow.classList.toggle('maximized');
});
closeBlogsBtn.addEventListener('click', () => {
  closeBlogs();
});
