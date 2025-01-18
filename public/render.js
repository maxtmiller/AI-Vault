document.addEventListener("DOMContentLoaded", () => {
    function getModelsFromDOM() {
        const cards = document.querySelectorAll(".model-card");
        return Array.from(cards).map(card => {
            const name = card.querySelector("h3").textContent;
            const type = card.querySelector("p:nth-of-type(1)").textContent.split(": ")[1].toLowerCase();
            const lastUpdated = card.querySelector("p:nth-of-type(2)").textContent.split(": ")[1];
            return { name, type, lastUpdated };
        });
    }

    const allModels = getModelsFromDOM();

    function renderModels(filteredModels) {
        const container = document.getElementById("models-section");
        container.innerHTML = ""; // Clear existing models

        if (filteredModels.length === 0) {
            container.innerHTML = "<p>No models found.</p>";
            return;
        }

        filteredModels.forEach(model => {
            const card = document.createElement("div");
            card.className = "model-card";
            card.innerHTML = `
                <h3>${model.name}</h3>
                <p>Type: ${capitalize(model.type)}</p>
                <p>Last Updated: ${model.lastUpdated}</p>
                <button>View Details</button>
            `;
            container.appendChild(card);
        });
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function filterModels() {
        const searchQuery = document.getElementById("search-bar").value.toLowerCase();
        const typeFilter = document.getElementById("type-filter").value;

        // const allModels = getModelsFromDOM();

        console.log(allModels);

        // Filter logic
        const filtered = allModels.filter(model => {
            const matchesSearch = model.name.toLowerCase().includes(searchQuery);
            const matchesType = typeFilter === "all" || model.type === typeFilter;
            return matchesSearch && matchesType;
        });

        // Re-render models
        console.log(filtered);
        renderModels(filtered);
    }

    // Event listeners
    const searchBar = document.getElementById("search-bar");
    const typeFilter = document.getElementById("type-filter");

    searchBar.addEventListener("input", () => {
        console.log("Search query:", searchBar.value); // Debug log
        filterModels();
    });

    typeFilter.addEventListener("change", filterModels);

    // Initial render
    const initialModels = getModelsFromDOM();
    renderModels(initialModels);
});
