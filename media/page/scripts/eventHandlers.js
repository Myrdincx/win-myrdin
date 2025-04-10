import { startMenu, blogsAppBtn } from "./domElements.js";
import { loadBlogManifest } from "./blogManagement.js";

// Event listener for the Start button
document.getElementById("startBtn").addEventListener("click", () => {
  startMenu.style.display = startMenu.style.display === "block" ? "none" : "block";
});

// Event listener for the Blogs App button
blogsAppBtn.addEventListener("click", () => {
  loadBlogManifest();
});
