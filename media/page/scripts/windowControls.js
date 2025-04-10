function enableDragging(windowEl, titleBarEl) {
  let offsetX = 0, offsetY = 0, isDragging = false;
  titleBarEl.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - windowEl.offsetLeft;
    offsetY = e.clientY - windowEl.offsetTop;
  });
  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      windowEl.style.left = e.clientX - offsetX + "px";
      windowEl.style.top = e.clientY - offsetY + "px";
    }
  });
  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
}

function enableResizing(windowEl) {
  let isResizing = false;
  const resizeHandle = windowEl.querySelector(".resize-handle");
  resizeHandle.addEventListener("mousedown", (e) => {
    isResizing = true;
  });
  document.addEventListener("mousemove", (e) => {
    if (isResizing) {
      // Add your resizing logic here
    }
  });
  document.addEventListener("mouseup", () => {
    isResizing = false;
  });
}

export { enableDragging, enableResizing };

