console.log("Content script loaded on:", window.location.href);

// Example: Extract meta tags
const metaTags = document.getElementsByTagName("meta");
for (let tag of metaTags) {
  console.log(tag.name, tag.content);
}

// Send data to the background script
chrome.runtime.sendMessage({
  type: "page-analysis",
  url: window.location.href,
  metaTags: Array.from(metaTags).map((tag) => ({
    name: tag.name,
    content: tag.content
  }))
});
