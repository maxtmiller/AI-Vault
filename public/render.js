document.addEventListener("DOMContentLoaded", () => {
    // Function to extract models dynamically from the DOM
    function getModelsFromDOM() {
        const cards = document.querySelectorAll(".model-card");
        return Array.from(cards).map(card => {
            const name = card.querySelector("h3").textContent;
            const type = card.querySelector("p:nth-of-type(1)").textContent.split(": ")[1].toLowerCase();
            const lastUpdated = card.querySelector("p:nth-of-type(2)").textContent.split(": ")[1];
            return { name, type, lastUpdated };
        });
    }

    // Function to render models into the DOM
    function renderModels(filteredModels) {
        const container = document.getElementById("models-container");
        container.innerHTML = ""; // Clear existing cards

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

    // Utility function to capitalize the first letter
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Function to filter models
    function filterModels() {
        const searchQuery = document.getElementById("search-bar").value.toLowerCase();
        const typeFilter = document.getElementById("type-filter").value;

        const allModels = getModelsFromDOM();
        const filtered = allModels.filter(model => {
            const matchesSearch = model.name.toLowerCase().includes(searchQuery);
            const matchesType = typeFilter === "all" || model.type === typeFilter;
            return matchesSearch && matchesType;
        });

        renderModels(filtered);
    }

    // Attach event listeners to search bar and filter dropdown
    document.getElementById("search-bar").addEventListener("input", filterModels);
    document.getElementById("type-filter").addEventListener("change", filterModels);

    // Initial render of models
    const initialModels = getModelsFromDOM();
    console.log(initialModels);
    renderModels(initialModels);
});
