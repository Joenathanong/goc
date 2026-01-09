document.addEventListener("DOMContentLoaded", function () {
  const logo = document.getElementById("profilePicture");
  let clickCount = 0;
  let clickTimer = null;
  const SECRET_TEXT = "H38*IdR!dRep";

  logo.addEventListener("click", function () {
    clickCount++;

    // reset timer setiap klik
    if (clickTimer) clearTimeout(clickTimer);

    clickTimer = setTimeout(() => {
      clickCount = 0;
    }, 600); // 600ms = batas "cepat"

    if (clickCount === 3) {
      copyToClipboard(SECRET_TEXT);
      clickCount = 0;
    }
  });

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      console.log("Copied to clipboard:", text);
      // Optional: tampilkan notifikasi kecil
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
});



document.addEventListener("DOMContentLoaded", function() {
    const infoBox = document.getElementById("info1");
    const links = document.querySelectorAll(".link");
    const searchInput = document.getElementById("searchInput");
    
    // Default state
    infoBox.textContent = "🔍"; // Hanya tampilkan kaca pembesar
    infoBox.style.cursor = "default";
    
    // Track search state
    let isSearching = false;
    let searchResultsCount = 0;
    
    // Hover effect
    const handleHover = (link) => {
        const infoText = link.dataset.info || "Tidak ada deskripsi";
        infoBox.textContent = infoText;
        infoBox.style.color = "#ffffff";
    };
    
    const resetInfoBox = () => {
        if (isSearching && searchResultsCount > 1) {
            infoBox.textContent = "🔍"; // Kembali ke kaca pembesar jika multiple results
        } else if (searchResultsCount === 0) {
            infoBox.textContent = searchInput.value ? "Tidak ditemukan hasil" : "🔍";
        }
        infoBox.style.color = "#ffffff";
    };
    
    links.forEach(link => {
        link.addEventListener("mouseenter", () => handleHover(link));
        link.addEventListener("mouseleave", resetInfoBox);
    });
    
    // Search functionality
    searchInput.addEventListener("input", function() {
        const keyword = this.value.toLowerCase();
        searchResultsCount = 0;
        isSearching = keyword.length > 0;
        
        links.forEach(link => {
            const text = link.textContent.toLowerCase();
            const isVisible = text.includes(keyword);
            link.style.display = isVisible ? "block" : "none";
            if (isVisible) searchResultsCount++;
        });
        
        // Update info box based on results
        if (searchResultsCount === 0 && isSearching) {
            infoBox.textContent = "Tidak ditemukan hasil";
        } else if (searchResultsCount === 1) {
            // Tampilkan info dari satu-satunya hasil
            const visibleLink = document.querySelector('.link[style*="block"]');
            handleHover(visibleLink);
        } else {
            // Multiple results - reset ke kaca pembesar
            infoBox.textContent = "🔍";
        }
    });
});
