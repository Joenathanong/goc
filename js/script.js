document.addEventListener("DOMContentLoaded", function() {
    // 1. Menampilkan data-info saat hover
    var infoBox = document.getElementById("info1");
    var links = document.querySelectorAll(".link");

    links.forEach(function(link) {
        link.addEventListener("mouseover", function() {
            var infoText = this.getAttribute("data-info");
            infoBox.textContent = infoText;
            infoBox.style.display = "block";
        });

        link.addEventListener("mouseout", function() {
            infoBox.style.display = "none";
        });
    });

    // 2. Pencarian langsung
    var searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("input", function() {
        var keyword = this.value.toLowerCase();
        var visibleLinks = 0;
        
        links.forEach(function(link) {
            var text = link.textContent.toLowerCase() || link.innerText.toLowerCase();
            if (text.includes(keyword)) {
                link.style.display = "block";
                visibleLinks++;
            } else {
                link.style.display = "none";
            }
        });

        // Optional: Tampilkan pesan jika tidak ada hasil
        var noResults = document.getElementById("noResults");
        if (visibleLinks === 0 && keyword.length > 0) {
            if (!noResults) {
                noResults = document.createElement("div");
                noResults.id = "noResults";
                noResults.textContent = "Tidak ditemukan hasil untuk '" + keyword + "'";
                document.getElementById("links").appendChild(noResults);
            }
        } else if (noResults) {
            noResults.remove();
        }
    });
});
