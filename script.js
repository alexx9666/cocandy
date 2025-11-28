// **NOTE: REPLACE THIS WITH YOUR DEPLOYED WEB APP URL (Execution URL) **
const APP_URL = 'https://script.google.com/macros/s/AKfycbzEcqQuUg5TYSHwRPpd2wWh-sW74Rzfa1mELH22R-w3YrryjbvX0wZn4SoG1l0iC3m8Pw/exec'; 

let allData = []; 

// ----------------------
// 1. DATA SUBMISSION (UPLOAD) - Using Fetch for File Upload
//    - Headers are NOT set here; the browser must set 'multipart/form-data'.
// ----------------------
document.getElementById('meterDataForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = e.target;
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.innerHTML = '<span class="text-info">डेटा और इमेज अपलोड हो रहे हैं... कृपया प्रतीक्षा करें।</span>';

    const formData = new FormData(form);
    formData.append('action', 'SUBMIT_DATA'); // Add action parameter

    fetch(APP_URL, {
        method: 'POST',
        // IMPORTANT: DO NOT set headers for FormData; the browser handles it.
        body: formData, 
    })
    .then(response => {
        if (!response.ok) {
            // Log the error status if the network call succeeded but the API responded with an error status (e.g., 400 or 500)
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            statusDiv.innerHTML = `<span class="text-success">${data.message}</span>`;
            form.reset(); 
            loadData(); // Reload table
        } else {
            // Handle error messages returned from Code.gs
            statusDiv.innerHTML = `<span class="text-danger">Upload Failed: ${data.message}</span>`;
        }
    })
    .catch(error => {
        // Handle network/fetch errors (like Failed to fetch/CORS)
        console.error('Fetch Error:', error);
        statusDiv.innerHTML = `<span class="text-danger">Network or API Error: ${error.message || error}</span>`;
    });
});

// ----------------------
// 2. DATA LOADING & RENDERING - Using Fetch (GET_DATA)
//    - Headers are set to 'application/x-www-form-urlencoded' for simple POST data.
// ----------------------
function loadData() {
    const tableBody = document.getElementById('dataTableBody');
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-info">डेटा लोड हो रहा है...</td></tr>';
    
    // Call the API to get data
    fetch(APP_URL, {
        method: 'POST',
        // IMPORTANT: Set this header for simple key-value pairs
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, 
        body: 'action=GET_DATA' // Simple key-value pair string
    })
    .then(response => {
        if (!response.ok) {
             throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
             tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">लोड त्रुटि: ${data.error}</td></tr>`;
        } else {
             renderTable(data);
        }
    })
    .catch(error => {
        console.error('Load Error:', error);
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">लोड त्रुटि: ${error.message || error}</td></tr>`;
    });
}

// Data rendering logic
function renderTable(data) {
    allData = data; 
    const tableBody = document.getElementById('dataTableBody');
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">कोई डेटा नहीं मिला।</td></tr>';
        return;
    }

    data.forEach(item => {
        const row = tableBody.insertRow();
        
        // Ensure date is handled gracefully
        const dateValue = item.Timestamp;
        let date;
        if (typeof dateValue === 'object' && dateValue !== null && dateValue instanceof Date) {
            date = dateValue.toLocaleDateString('en-IN');
        } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
            date = new Date(dateValue).toLocaleDateString('en-IN');
        } else {
            date = 'N/A';
        }
        
        row.insertCell().textContent = item.Consumer_Account_No;
        row.insertCell().textContent = item.New_Meter_No || 'N/A';
        row.insertCell().textContent = item.Cum_KWH_Reading || 'N/A';
        row.insertCell().textContent = date;
        
        const actionCell = row.insertCell();
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm btn-outline-warning';
        editBtn.textContent = 'Edit';
        editBtn.setAttribute('data-bs-toggle', 'modal');
        editBtn.setAttribute('data-bs-target', '#editModal');
        editBtn.onclick = () => fillEditModal(item);
        actionCell.appendChild(editBtn);
    });
}

// ----------------------
// 3. SEARCH/FILTER FUNCTION
// ----------------------
function filterTable() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const tableBody = document.getElementById('dataTableBody');
    tableBody.innerHTML = ''; 

    const filteredData = allData.filter(item => 
        (item.Consumer_Account_No && item.Consumer_Account_No.toString().toLowerCase().includes(input)) ||
        (item.Old_Meter_No && item.Old_Meter_No.toString().toLowerCase().includes(input)) ||
        (item.New_Meter_No && item.New_Meter_No.toString().toLowerCase().includes(input)) ||
        (item.Box_No && item.Box_No.toString().toLowerCase().includes(input))
    );

    renderTable(filteredData); 
}

// ----------------------
// 4. EDIT FUNCTIONALITY
// ----------------------
function fillEditModal(data) {
    document.getElementById('editRowIndex').value = data.ROW_INDEX;
    document.getElementById('editConsumerAccountNo').value = data.Consumer_Account_No;
    document.getElementById('editOldMeterNo').value = data.Old_Meter_No;
    document.getElementById('editNewMeterNo').value = data.New_Meter_No;
    document.getElementById('editBoxNo').value = data.Box_No;
    document.getElementById('editSealingNo').value = data.Sealing_No;
    document.getElementById('editCumKWHReading').value = data.Cum_KWH_Reading;
    document.getElementById('editKwhMDReading').value = data.KWH_MD_Reading;
    document.getElementById('editMdImageLink').value = data.MD_Image_Link === 'No Image Uploaded' ? '' : data.MD_Image_Link;
    document.getElementById('editSealingImageLink').value = data.Sealing_Image_Link === 'No Image Uploaded' ? '' : data.Sealing_Image_Link;
    document.getElementById('editRemarks').value = data.Remarks;
}

document.getElementById('editDataForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const form = e.target;
    const formData = {};
    
    new FormData(form).forEach((value, key) => {
        formData[key] = value;
    });

    const statusDiv = document.getElementById('editStatusMessage');
    statusDiv.innerHTML = '<span class="text-info">अपडेट हो रहा है...</span>';
    
    // Prepare JSON payload for EDIT_DATA action
    const payload = {
        action: 'EDIT_DATA', // Included for debugging/tracking
        ...formData
    };

    fetch(APP_URL, {
        method: 'POST',
        // IMPORTANT: Send as JSON for EDIT
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            statusDiv.innerHTML = `<span class="text-success">${data.message}</span>`;
            loadData(); 
            // Close modal after a short delay
            setTimeout(() => {
                // Ensure Bootstrap Modal instance is fetched correctly
                const modal = bootstrap.Modal.getInstance(document.getElementById('editModal')) || new bootstrap.Modal(document.getElementById('editModal'));
                modal.hide();
            }, 1500);
        } else {
            statusDiv.innerHTML = `<span class="text-danger">${data.message}</span>`;
        }
    })
    .catch(error => {
        console.error('Edit Network Error:', error);
        statusDiv.innerHTML = `<span class="text-danger">Network Error: ${error.message || error}</span>`;
    });
});

// Initialize the app
window.onload = loadData;