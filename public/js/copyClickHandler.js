function copyToClipboard() {
  const link = document.getElementById("messageLink").innerText;
  navigator.clipboard.writeText(link);
  alert("Link copied to clipboard");
}

const copyToClipboardButton = document.getElementById("copyToClipboardButton");
copyToClipboardButton.addEventListener("click", copyToClipboard);
