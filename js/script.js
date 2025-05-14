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
