document.getElementById("scan-button").addEventListener("click", () => {
  // Disable the button during scanning
  const scanButton = document.getElementById("scan-button");
  scanButton.disabled = true;
  scanButton.innerText = "Scanning...";

  // Get the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];

    if (!activeTab) {
      console.error("No active tab found!");
      return;
    }

    // Send the URL to the background script for scanning
    chrome.runtime.sendMessage({ type: "scan-website", url: activeTab.url }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error in sending message:", chrome.runtime.lastError);
        document.getElementById("results").innerText = "Error: Could not establish connection.";
        scanButton.disabled = false;
        scanButton.innerText = "Scan Website";
        return;
      }

      // Check if the response is valid
      if (response && response.message) {
        document.getElementById("results").innerText = response.message;
      } else {
        document.getElementById("results").innerText = "Analysis complete.";
      }

      // Re-enable the button after scanning
      scanButton.disabled = false;
      scanButton.innerText = "Scan Website";
    });
  });
});
