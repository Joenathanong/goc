// Configuration
const API_URL = "https://script.google.com/macros/s/AKfycbwJhkOjCHSzVDOGvoaDyZdcWJBP8UupnwuKBM3aM5brJ4FVDHBq458SK6mDRd4VZMPqHQ/exec";

// State
let originalData = [];
let filteredData = [];
let headers = [];
let currentPage = 1;
const rowsPerPage = 20;
let totalPages = 1;
let filterTimeout = null;

// Column mapping
const COLUMN_MAPPING = {
    MATERIAL: 0,
    DESCRIPTION: 1,
    DIVISION: 2,
    STATUS: 3,
    STOCK_AWAL: 4,
    ORDER_MASUK: 5,
    STOCK_AKHIR: 6,
    KETERANGAN: 7,
    ESTIMASI_GR: 8,
    KETERANGAN_TAMBAHAN: 9
};

// Fungsi untuk membuka halaman detail stock (GANTI DENGAN LINK ANDA)
function openDetailStock() {
    // GANTI URL INI DENGAN LINK HALAMAN DETAIL STOCK ANDA
    const detailUrl = '#';
    window.open(detailUrl, '_blank');
}

// Theme management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// Fungsi untuk membersihkan format angka Indonesia (1.000 -> 1000)
function cleanIndonesianNumber(value) {
    if (!value) return 0;
    
    let strValue = value.toString();
    strValue = strValue.replace(/PC/gi, '').trim();
    
    // Handle angka dengan koma (12,5 -> 12.5)
    if (strValue.includes(',') && !strValue.includes('.')) {
        strValue = strValue.replace(',', '.');
    }
    
    const cleanStr = strValue
        .replace(/\./g, '') // hapus titik ribuan
        .replace(/,/g, '.'); // ganti koma desimal jadi titik
    
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
}

// Fungsi untuk format angka ke tampilan Indonesia (1000 -> 1.000)
function formatIndonesianNumber(value) {
    if (value === undefined || value === null) return '0';
    
    if (typeof value === 'number') {
        return value.toLocaleString('id-ID');
    }
    
    const num = cleanIndonesianNumber(value);
    return num.toLocaleString('id-ID');
}

// Fungsi untuk format tanggal dan jam (14/02/2026 08.00 AM)
function formatDateTimeIndonesia(dateString) {
    if (!dateString) return 'Tanggal tidak tersedia';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12;
        const hoursStr = hours.toString().padStart(2, '0');
        
        return `${day}/${month}/${year} ${hoursStr}.${minutes} ${ampm}`;
    } catch (e) {
        return dateString;
    }
}

// Home button function
function goToHome() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showNotification('Kembali ke menu utama');
}

// Fungsi notifikasi
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--btn-primary);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

/// Fetch data (VERSI WEB APP JSON)
async function fetchData() {
    showLoading(true);
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Gagal mengambil data dari server");

        const rows = await response.json(); // ⬅ sekarang JSON, bukan CSV

        if (rows.length >= 3) {
            headers = rows[2];
            updateLastUpdate(rows);

            originalData = rows.slice(3).filter(row => 
                row.length >= 10 && row.some(cell => cell && cell.toString().trim() !== '')
            );

            // Konversi kolom angka ke number
            originalData = originalData.map(row => {
                const newRow = [...row];
                newRow[COLUMN_MAPPING.STOCK_AWAL] = cleanIndonesianNumber(row[COLUMN_MAPPING.STOCK_AWAL]);
                newRow[COLUMN_MAPPING.ORDER_MASUK] = cleanIndonesianNumber(row[COLUMN_MAPPING.ORDER_MASUK]);
                newRow[COLUMN_MAPPING.STOCK_AKHIR] = cleanIndonesianNumber(row[COLUMN_MAPPING.STOCK_AKHIR]);
                return newRow;
            });

            console.log('Data loaded:', originalData.length, 'rows');

            applyDefaultFilter();
            renderHeader();
            populateFilterOptions();

        } else {
            throw new Error('Gagal mengakses data, silahkan refresh halaman.');
        }

    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
}


// Apply default filter (produk aktif)
function applyDefaultFilter() {
    filteredData = originalData.filter(row => {
        const status = (row[COLUMN_MAPPING.STATUS] || '').toString().trim().toLowerCase();
        return status === 'active' || status === 'aktif';
    });
    
    currentPage = 1;
    totalPages = Math.ceil(filteredData.length / rowsPerPage);
    
    renderTable();
    updateStats();
    renderPagination();
    
    document.getElementById('filterResultCount').innerHTML = 
        `${filteredData.length} dari ${originalData.length} data ditampilkan`;
}

// Parse CSV
function parseCSV(csvText) {
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        
        if (char === '"' && !inQuotes) {
            inQuotes = true;
        } else if (char === '"' && inQuotes) {
            inQuotes = false;
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
        } else if (char === '\n' && !inQuotes) {
            currentRow.push(currentCell.trim());
            rows.push(currentRow);
            currentRow = [];
            currentCell = '';
        } else {
            currentCell += char;
        }
    }
    
    if (currentRow.length > 0 || currentCell) {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
    }
    
    return rows;
}

// Update last update date
function updateLastUpdate(rows) {
    let updateDate = 'Tanggal tidak tersedia';
    if (rows.length >= 2 && rows[1].length >= 2) {
        updateDate = rows[1][1] || 'Tanggal tidak tersedia';
    }
    const formattedDateTime = formatDateTimeIndonesia(updateDate);
    document.getElementById('updateDateLabel').innerHTML = `Update Stock Pertanggal : ${formattedDateTime}`;
}

// Render header (TANPA kolom Detail)
function renderHeader() {
    const thead = document.getElementById('tableHeader');
    thead.innerHTML = `
        <tr>
            <th style="width: 50px;">No</th>
            ${headers.slice(0, 10).map(header => `<th>${header || '-'}</th>`).join('')}
        </tr>
    `;
}

// Populate filter options
function populateFilterOptions() {
    const divisionSet = new Set();
    const statusSet = new Set();
    
    originalData.forEach(row => {
        if (row[COLUMN_MAPPING.DIVISION]) divisionSet.add(row[COLUMN_MAPPING.DIVISION]);
        if (row[COLUMN_MAPPING.STATUS]) statusSet.add(row[COLUMN_MAPPING.STATUS]);
    });
    
    const divisionSelect = document.getElementById('filterDivision');
    divisionSelect.innerHTML = '<option value="">Semua Division</option>';
    Array.from(divisionSet).sort().forEach(division => {
        divisionSelect.innerHTML += `<option value="${division}">${division}</option>`;
    });
    
    const statusSelect = document.getElementById('filterStatus');
    statusSelect.innerHTML = '<option value="">Semua Status</option>';
    Array.from(statusSet).sort().forEach(status => {
        statusSelect.innerHTML += `<option value="${status}">${status}</option>`;
    });
    
    // Set default status filter di dropdown menjadi "Active"
    setTimeout(() => {
        const activeOption = Array.from(statusSelect.options).find(opt => 
            opt.value.toLowerCase() === 'active' || opt.value.toLowerCase() === 'aktif'
        );
        if (activeOption) {
            statusSelect.value = activeOption.value;
        }
    }, 500);
}

// Live filter
function setupLiveFilters() {
    document.querySelectorAll('.live-filter').forEach(element => {
        element.addEventListener('input', () => {
            clearTimeout(filterTimeout);
            filterTimeout = setTimeout(applyFilters, 300);
        });
        element.addEventListener('change', applyFilters);
    });
}

// Apply filters
function applyFilters() {
    const filters = {
        material: document.getElementById('filterMaterial').value.toLowerCase(),
        description: document.getElementById('filterDescription').value.toLowerCase(),
        division: document.getElementById('filterDivision').value,
        status: document.getElementById('filterStatus').value,
        estimasi: document.getElementById('filterEstimasi').value.toLowerCase(),
        keterangan: document.getElementById('filterKeterangan').value.toLowerCase()
    };
    
    filteredData = originalData.filter(row => {
        // Material filter
        if (filters.material && !(row[COLUMN_MAPPING.MATERIAL] || '').toLowerCase().includes(filters.material)) {
            return false;
        }
        
        // Description filter
        if (filters.description && !(row[COLUMN_MAPPING.DESCRIPTION] || '').toLowerCase().includes(filters.description)) {
            return false;
        }
        
        // Division filter
        if (filters.division && row[COLUMN_MAPPING.DIVISION] !== filters.division) {
            return false;
        }
        
        // Status filter
        if (filters.status) {
            const rowStatus = (row[COLUMN_MAPPING.STATUS] || '').trim();
            if (rowStatus.toLowerCase() !== filters.status.toLowerCase()) {
                return false;
            }
        }
        
        // Estimasi filter
        if (filters.estimasi && !(row[COLUMN_MAPPING.ESTIMASI_GR] || '').toLowerCase().includes(filters.estimasi)) {
            return false;
        }
        
        // Keterangan filter
        if (filters.keterangan) {
            const keterangan = (row[COLUMN_MAPPING.KETERANGAN] || '').toLowerCase();
            const keteranganTambahan = (row[COLUMN_MAPPING.KETERANGAN_TAMBAHAN] || '').toLowerCase();
            if (!keterangan.includes(filters.keterangan) && !keteranganTambahan.includes(filters.keterangan)) {
                return false;
            }
        }
        
        return true;
    });
    
    currentPage = 1;
    totalPages = Math.ceil(filteredData.length / rowsPerPage);
    renderTable();
    updateStats();
    renderPagination();
    
    document.getElementById('filterResultCount').innerHTML = 
        `${filteredData.length} dari ${originalData.length} data ditampilkan`;
}

// Clear filters
function clearFilters() {
    document.getElementById('filterMaterial').value = '';
    document.getElementById('filterDescription').value = '';
    document.getElementById('filterEstimasi').value = '';
    document.getElementById('filterKeterangan').value = '';
    document.getElementById('filterDivision').value = '';
    
    const statusSelect = document.getElementById('filterStatus');
    const activeOption = Array.from(statusSelect.options).find(opt => 
        opt.value.toLowerCase() === 'active' || opt.value.toLowerCase() === 'aktif'
    );
    if (activeOption) {
        statusSelect.value = activeOption.value;
    }
    
    applyDefaultFilter();
    showNotification('Filter direset ke default (Hanya tampil produk aktif)');
}

// Render table (TANPA button detail)
function renderTable() {
    const tbody = document.getElementById('tableBody');
    
    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 30px;">📭 Tidak ada data</td></tr>';
        updateDataCount(0, 0, 0);
        return;
    }
    
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, filteredData.length);
    const pageData = filteredData.slice(startIndex, endIndex);
    
    tbody.innerHTML = pageData.map((row, index) => {
        const rowNumber = startIndex + index + 1;
        const status = row[COLUMN_MAPPING.STATUS] || '';
        const statusClass = getStatusClass(status);
        
        const stockAwal = row[COLUMN_MAPPING.STOCK_AWAL] || 0;
        const orderMasuk = row[COLUMN_MAPPING.ORDER_MASUK] || 0;
        const stockAkhir = row[COLUMN_MAPPING.STOCK_AKHIR] || 0;
        
        // Tentukan class untuk stock
        let stockClass = 'text-right';
        if (stockAkhir < 0) {
            stockClass += ' stock-negatif';
        } else if (stockAkhir === 0) {
            stockClass += ' stock-kosong';
        } else if (stockAkhir < 1000) {
            stockClass += ' stock-menipis';
        }
        
        return `
            <tr>
                <td>${rowNumber}</td>
                <td>${row[COLUMN_MAPPING.MATERIAL] || '-'}</td>
                <td>${row[COLUMN_MAPPING.DESCRIPTION] || '-'}</td>
                <td>${row[COLUMN_MAPPING.DIVISION] || '-'}</td>
                <td><span class="status-badge ${statusClass}">${status || '-'}</span></td>
                <td class="text-right">${formatIndonesianNumber(stockAwal)}</td>
                <td class="text-right">${formatIndonesianNumber(orderMasuk)}</td>
                <td class="${stockClass}">
                    ${formatIndonesianNumber(stockAkhir)}
                </td>
                <td>${row[COLUMN_MAPPING.KETERANGAN] || '-'}</td>
                <td>${row[COLUMN_MAPPING.ESTIMASI_GR] || '-'}</td>
                <td>${row[COLUMN_MAPPING.KETERANGAN_TAMBAHAN] || '-'}</td>
            </tr>
        `;
    }).join('');
    
    updateDataCount(startIndex + 1, endIndex, filteredData.length);
}

// Helper functions
function getStatusClass(status) {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'active') return 'status-active';
    if (statusLower === 'inactive') return 'status-inactive';
    return 'status-pending';
}

function updateDataCount(start, end, total) {
    document.getElementById('dataCount').textContent = 
        total ? `Menampilkan ${start}-${end} dari ${total}` : 'Menampilkan 0 data';
    document.getElementById('totalDataCount').textContent = `Total ${originalData.length} data`;
}

// Update statistics dengan card baru
function updateStats() {
    // Total Items
    document.getElementById('totalItems').textContent = filteredData.length;
    
    // Total Stock Akhir
    const totalStock = filteredData.reduce((sum, row) => 
        sum + (parseFloat(row[COLUMN_MAPPING.STOCK_AKHIR]) || 0), 0);
    document.getElementById('totalStockAkhir').textContent = formatIndonesianNumber(totalStock);
    
    // Total Order Masuk
    const totalOrder = filteredData.reduce((sum, row) => 
        sum + (parseFloat(row[COLUMN_MAPPING.ORDER_MASUK]) || 0), 0);
    document.getElementById('totalOrderMasuk').textContent = formatIndonesianNumber(totalOrder);
    
    // Total Produk Aktif
    const totalAktif = filteredData.filter(row => {
        const status = (row[COLUMN_MAPPING.STATUS] || '').toString().trim().toLowerCase();
        return status === 'active' || status === 'aktif';
    }).length;
    document.getElementById('totalProdukAktif').textContent = totalAktif;
    
    // Stock Menipis (stock positif kurang dari 1000)
    const totalMenipis = filteredData.filter(row => {
        const stock = parseFloat(row[COLUMN_MAPPING.STOCK_AKHIR]) || 0;
        return stock > 0 && stock < 1000;
    }).length;
    document.getElementById('totalStockMenipis').textContent = totalMenipis;
    
    // Stock Minus/Kosong (stock <= 0)
    const totalMinusKosong = filteredData.filter(row => {
        const stock = parseFloat(row[COLUMN_MAPPING.STOCK_AKHIR]) || 0;
        return stock <= 0;
    }).length;
    document.getElementById('totalStockMinusKosong').textContent = totalMinusKosong;
}

// Pagination
function renderPagination() {
    const paginationDiv = document.getElementById('pagination');
    if (totalPages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }
    
    let html = `<button class="btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i>
    </button>`;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<button class="btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<span class="btn" disabled>...</span>`;
        }
    }
    
    html += `<button class="btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-chevron-right"></i>
    </button>`;
    
    paginationDiv.innerHTML = html;
}

function changePage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTable();
    renderPagination();
}

// Export to Excel
function exportToExcel() {
    if (filteredData.length === 0) {
        alert('Tidak ada data untuk diexport');
        return;
    }
    
    try {
        showLoading(true);
        
        const now = new Date();
        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const year = now.getFullYear();
        
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const hoursStr = hours.toString().padStart(2, '0');
        
        const dateTimeStr = `${year}-${month}-${day} ${hoursStr}.${minutes} ${ampm}`;
        
        const excelData = [];
        excelData.push(['LAPORAN INVENTORY FINISHED GOODS']);
        excelData.push([`Download: ${dateTimeStr}`]);
        excelData.push([]);
        excelData.push(['No', ...headers.slice(0, 10)]);
        
        filteredData.forEach((row, index) => {
            excelData.push([
                index + 1,
                row[COLUMN_MAPPING.MATERIAL] || '',
                row[COLUMN_MAPPING.DESCRIPTION] || '',
                row[COLUMN_MAPPING.DIVISION] || '',
                row[COLUMN_MAPPING.STATUS] || '',
                row[COLUMN_MAPPING.STOCK_AWAL] || 0,
                row[COLUMN_MAPPING.ORDER_MASUK] || 0,
                row[COLUMN_MAPPING.STOCK_AKHIR] || 0,
                row[COLUMN_MAPPING.KETERANGAN] || '',
                row[COLUMN_MAPPING.ESTIMASI_GR] || '',
                row[COLUMN_MAPPING.KETERANGAN_TAMBAHAN] || ''
            ]);
        });
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        
        ws['!cols'] = [
            { wch: 6 }, { wch: 18 }, { wch: 45 }, { wch: 15 }, { wch: 12 },
            { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 25 }, { wch: 30 }
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
        
        const fileName = `inventory_${year}-${month}-${day} ${hoursStr}.${minutes} ${ampm}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showNotification(`Export berhasil: ${fileName}`);
        
    } catch (error) {
        console.error('Export error:', error);
        alert('Gagal export ke Excel: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Loading overlay
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.toggle('active', show);
    }
}

// Error display
function showError(message) {
    document.getElementById('tableBody').innerHTML = `
        <tr>
            <td colspan="11" class="error">
                <i class="fas fa-exclamation-triangle"></i> Error: ${message}
            </td>
        </tr>
    `;
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .stock-menipis {
        color: #e67e22 !important;
        font-weight: bold;
    }
    
    .stock-negatif {
        color: #e74c3c !important;
        font-weight: bold;
    }
    
    .stock-kosong {
        color: #7f8c8d !important;
        font-style: italic;
    }
    
    [data-theme="dark"] .stock-menipis {
        color: #f39c12 !important;
    }
    
    [data-theme="dark"] .stock-negatif {
        color: #ff6b6b !important;
    }
    
    [data-theme="dark"] .stock-kosong {
        color: #bdc3c7 !important;
    }
    
    .btn-detail-global {
        background: #9b59b6;
        color: white;
    }
    
    .btn-detail-global:hover {
        background: #8e44ad;
    }
    
    [data-theme="dark"] .btn-detail-global {
        background: #8e44ad;
    }
    
    [data-theme="dark"] .btn-detail-global:hover {
        background: #9b59b6;
    }
`;
document.head.appendChild(style);

function goToHome() {
    window.location.href = "https://jntn.site/ShareFGWH.html";
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('homeButton').addEventListener('click', (e) => {
        e.preventDefault();
        goToHome();
    });
    setupLiveFilters();
    fetchData();
    setInterval(fetchData, 300000);

});
