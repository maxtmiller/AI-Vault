chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "scan-website") {
    const url = message.url;
    
    // Simulate website scanning (this is just a placeholder)
    console.log(`Scanning website: ${url}`);
    
    // After simulating a scan, send a response
    setTimeout(() => {
      sendResponse({ message: `Scan complete for ${url}. No issues found.` });
    }, 2000); // Simulate some delay for scanning

    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
});
