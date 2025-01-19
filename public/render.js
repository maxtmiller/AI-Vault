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

    function getRandomInt(min, max) {
        min = Math.ceil(min); // Round up the minimum value
        max = Math.floor(max); // Round down the maximum value
        return Math.floor(Math.random() * (max - min + 1)) + min; // Generate random integer
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
            const val = getRandomInt(500, 12500)
            card.innerHTML = `
                <h3>${model.name}</h3>
                <p>Type: ${capitalize(model.type)}</p>
                <p>Last Updated: ${model.lastUpdated}</p>
                <form action="/model/678c799ebb0f7d784b454107" method="GET">
                    <button type="submit">View Details</button>
                </form>
                <form action="/cart/${val}" method="GET">
                    <button type="submit">Buy: $${val}</button>
                </form>
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
