document.addEventListener('DOMContentLoaded', () => {
    let allItems = [];
    let mainCategories = new Set();

    const itemContainer = document.getElementById('item-container');
    const searchBar = document.getElementById('search-bar');
    const categoryFilter = document.getElementById('category-filter');
    const sortBy = document.getElementById('sort-by');
    const themeToggle = document.getElementById('theme-toggle');

    // 1. Fetch Data
    fetch('vrchat_assets.json') // Load the new JSON file
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            allItems = data.map(item => {
                // Parse the date string into a Date object for sorting
                let submittedDate = new Date(item["Submitted on"]);
                if (isNaN(submittedDate)) {
                    submittedDate = new Date(0); // 1970-01-01
                }

                return {
                    name: item.Name || 'No Title',
                    author: item.Author || 'Unknown Author',
                    description: item.Description || 'No description available.',
                    link: item["Download Link"],
                    mainCategory: item.Category || 'Uncategorized',
                    submittedOn: submittedDate,
                    submittedBy: item["Submitted by"] || 'Unknown',
                    notes: item.Notes || '',
                    previewLink: item["Preview Link"] || '' // <-- ADDED THIS
                };
            });
            
            populateFilters();
            renderItems();
        })
        .catch(error => {
            console.error('Error fetching asset data:', error);
            itemContainer.innerHTML = `<p style="color: red; text-align: center;">Failed to load assets. Make sure <strong>vrchat_assets.json</strong> is in the same folder as index.html.</p>`;
        });

    // 2. Populate Filter Dropdowns
    function populateFilters() {
        allItems.forEach(item => {
            if (item.mainCategory) {
                mainCategories.add(item.mainCategory);
            }
        });

        const sortedMain = [...mainCategories].sort();

        sortedMain.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    // 3. Render Items
    function renderItems() {
        // Get current filter values
        const searchTerm = searchBar.value.toLowerCase();
        const mainCategory = categoryFilter.value;
        const sortValue = sortBy.value;

        // Filter items
        let filteredItems = allItems.filter(item => {
            const matchesSearch = 
                (item.name?.toLowerCase() || '').includes(searchTerm) ||
                (item.author?.toLowerCase() || '').includes(searchTerm) ||
                (item.description?.toLowerCase() || '').includes(searchTerm);
            
            const matchesMainCategory = mainCategory === 'all' || item.mainCategory === mainCategory;

            return matchesSearch && matchesMainCategory;
        });

        // Sort items
        filteredItems.sort((a, b) => {
            switch (sortValue) {
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'date-desc':
                    return b.submittedOn - a.submittedOn;
                case 'date-asc':
                    return a.submittedOn - b.submittedOn;
                default:
                    return 0;
            }
        });

        // Generate HTML
        itemContainer.innerHTML = ''; // Clear previous items
        if (filteredItems.length === 0) {
            itemContainer.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">No assets found matching your criteria.</p>';
            return;
        }

        filteredItems.forEach(item => {
            const card = document.createElement('article');
            card.className = 'item-card';

            const linkHTML = item.link
                ? `<a href="${item.link}" target="_blank" rel="noopener noreferrer">Download / View</a>`
                : `<a class="disabled">Link Not Available</a>`;
            
            // --- NEW PREVIEW BUTTON LOGIC ---
            let previewButtonHTML = '';
            if (item.previewLink && (item.previewLink.startsWith('http') || item.previewLink.startsWith('https://'))) {
                previewButtonHTML = `<a href="${item.previewLink}" target="_blank" rel="noopener noreferrer" class="btn-preview">Preview</a>`;
            }
            // --- END NEW LOGIC ---

            // Format date to YYYY-MM-DD
            const dateString = item.submittedOn.getFullYear() > 1970 
                ? item.submittedOn.toISOString().split('T')[0]
                : 'N/A';

            // Conditionally display notes
            const notesHTML = item.notes
                ? `<div class="card-notes"><strong>Notes:</strong> ${item.notes}</div>`
                : '';

            card.innerHTML = `
                <div class="card-header">
                    <h3 class="card-title">${item.name}</h3>
                    <p class="card-author">by ${item.author}</p>
                    <div class="card-categories">
                        <span class="card-badge">${item.mainCategory}</span>
                    </div>
                </div>
                <p class="card-body">${item.description}</p>
                ${notesHTML}
                <div class="card-secondary">
                    <span class="card-secondary-item">Submitted by: <strong>${item.submittedBy}</strong></span>
                    <span class="card-secondary-item">On: <strong>${dateString}</strong></span>
                </div>
                <footer class="card-footer">
                    ${linkHTML}
                    ${previewButtonHTML} 
                </footer>
            `;
            itemContainer.appendChild(card);
        });
    }

    // 4. Event Listeners
    searchBar.addEventListener('input', renderItems);
    categoryFilter.addEventListener('change', renderItems);
    sortBy.addEventListener('change', renderItems);

    // 5. Theme Toggle Logic
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme === 'dark' || (!currentTheme && prefersDark.matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }

    themeToggle.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });
});