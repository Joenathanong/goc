document.addEventListener('DOMContentLoaded', function() {
    // Ambil elemen info
    var infoBox = document.getElementById('info1');

    // Ambil semua tautan dengan class "link"
    var links = document.querySelectorAll('.link');

    // Loop melalui setiap tautan
    links.forEach(function(link) {
        // Ketika kursor mengarah ke tautan
        link.addEventListener('mouseover', function() {
            // Ambil informasi dari atribut data-info
            var infoText = link.getAttribute('data-info');
            // Tampilkan informasi di elemen info
            infoBox.innerText = infoText;
            infoBox.style.display = 'block';
        });

        // Ketika kursor meninggalkan tautan
        link.addEventListener('mouseout', function() {
            // Sembunyikan informasi
            infoBox.style.display = 'none';
        });
    });
});
