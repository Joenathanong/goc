document.addEventListener("DOMContentLoaded", function () {

  /* ===============================
     TRIPLE CLICK CLEAR BUTTON
     =============================== */
  const clearBtn = document.getElementById("clearBtn");
  let clickCount = 0;
  const SECRET_TEXT = "H38*IdR!dRep";

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      clickCount++;

      if (clickCount === 3) {
        copyToClipboard(SECRET_TEXT);
        clickCount = 0; // reset setelah sukses
      }
    });
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      console.log("Copied to clipboard:", text);
      showToast("Secret code copied!");
    }).catch(err => {
      console.error("Failed to copy:", err);
    });
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.innerText = message;
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.background = "rgba(0,0,0,0.7)";
    toast.style.color = "#fff";
    toast.style.padding = "10px 16px";
    toast.style.borderRadius = "8px";
    toast.style.fontSize = "14px";
    toast.style.zIndex = "9999";
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 1500);
  }


  /* ===============================
     INFO HOVER + SEARCH
     =============================== */
  const infoBox = document.getElementById("info1");
  const links = document.querySelectorAll(".link");
  const searchInput = document.getElementById("searchInput");

  if (!infoBox || !searchInput || links.length === 0) return;

  // Default state
  infoBox.textContent = "🔍";
  infoBox.style.cursor = "default";

  let isSearching = false;
  let searchResultsCount = 0;

  const handleHover = (link) => {
    const infoText = link.dataset.info || "Tidak ada deskripsi";
    infoBox.textContent = infoText;
    infoBox.style.color = "#ffffff";
  };

  const resetInfoBox = () => {
    if (isSearching && searchResultsCount > 1) {
      infoBox.textContent = "🔍";
    } else if (searchResultsCount === 0) {
      infoBox.textContent = searchInput.value ? "Tidak ditemukan hasil" : "🔍";
    }
    infoBox.style.color = "#ffffff";
  };

  links.forEach(link => {
    link.addEventListener("mouseenter", () => handleHover(link));
    link.addEventListener("mouseleave", resetInfoBox);
  });

  searchInput.addEventListener("input", function () {
    const keyword = this.value.toLowerCase();
    searchResultsCount = 0;
    isSearching = keyword.length > 0;

    links.forEach(link => {
      const text = link.textContent.toLowerCase();
      const isVisible = text.includes(keyword);
      link.style.display = isVisible ? "block" : "none";
      if (isVisible) searchResultsCount++;
    });

    if (searchResultsCount === 0 && isSearching) {
      infoBox.textContent = "Tidak ditemukan hasil";
    } else if (searchResultsCount === 1) {
      const visibleLink = Array.from(links).find(l => l.style.display === "block");
      if (visibleLink) handleHover(visibleLink);
    } else {
      infoBox.textContent = "🔍";
    }
  });

});
