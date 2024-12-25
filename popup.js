// Global translations object (popup context only)
const translations = {
  en: null,
  tr: null,
};

async function loadTranslations() {
  const en = await fetch("locales/en.json").then((res) => res.json());
  const tr = await fetch("locales/tr.json").then((res) => res.json());
  translations.en = en;
  translations.tr = tr;
}

// Update UI text without destroying the checkbox input
function applyTranslations(language) {
  const t = translations[language];
  if (!t) return;

  document.getElementById("title").textContent = t.title;
  document.getElementById("checkboxLabelText").textContent = t.checkboxLabel; // Only update the span
  document.getElementById("downloadBtn").textContent = t.buttonText;
  document.getElementById("warningText").textContent = t.warningText;
  document.getElementById("sourceCodeLink").textContent = t.sourceCode;
}

// Initialize popup
async function init() {
  await loadTranslations();

  // Language dropdown
  const languageSelect = document.getElementById("languageSelect");
  languageSelect.addEventListener("change", () => {
    applyTranslations(languageSelect.value);
  });

  // Apply default language
  applyTranslations(languageSelect.value);

  // Download button click
  document.getElementById("downloadBtn").addEventListener("click", async () => {
    const checkbox = document.getElementById("imageCheckbox");
    const imageIndex = checkbox.checked ? 2 : 3; // 3rd or 4th photo

    // Retrieve relevant translation texts from our local 'translations'
    const lang = languageSelect.value;
    const notEnoughImagesMsg = translations[lang].notEnoughImages;
    const downloadFailedMsg = translations[lang].downloadFailed;

    // Inject content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: downloadImageByIndex,
        args: [imageIndex, notEnoughImagesMsg, downloadFailedMsg],
      });
    });
  });
}

// This runs in the page context
function downloadImageByIndex(index, notEnoughImagesMsg, downloadFailedMsg) {
  const allImages = Array.from(document.querySelectorAll("img")).map((img) => ({
    src: img.src,
    fileName: img.src.split("/").pop().split("?")[0],
  }));

  // Check if we have enough images
  if (allImages.length <= index) {
    alert(notEnoughImagesMsg);
    return;
  }

  const targetImage = allImages[index];
  fetch(targetImage.src)
    .then((response) => response.blob())
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = targetImage.fileName;
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(blobUrl);
      link.remove();
    })
    .catch((error) => {
      console.error("Image download error:", error);
      alert(downloadFailedMsg);
    });
}

// Run everything
init();
