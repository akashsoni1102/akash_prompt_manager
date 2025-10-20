import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

/**
 * AKASH_PROMPT_MANAGER v1.0.0
 * Features: Favorites, Categories with Manage Dialog, Image Upload/Preview, Sticky Footer
 * Author: Akash Soni
 * GitHub: https://github.com/akashsoni1102/akash_prompt_manager
 */

const nodeStorage = new Map();

app.registerExtension({
    name: "akash.AKASH_PROMPT_MANAGER",

    async setup() {
        console.log("[Akash Prompt Manager v1.0.0] Extension loaded");
    },

    async beforeRegisterNodeDef(nodeType, nodeDefData, app) {
        if (nodeDefData.name !== "AKASH_PROMPT_MANAGER") return;

        const originalCreated = nodeType.prototype.onNodeCreated;
        const originalConfig = nodeType.prototype.configure;
        const originalSerialize = nodeType.prototype.serialize;

        nodeType.prototype.onNodeCreated = function() {
            const res = originalCreated ? originalCreated.apply(this, arguments) : undefined;

            this.prompts = [];
            this.selectedIndices = new Set();
            this.availableCategories = [];

            if (!nodeStorage.has(this.id)) {
                nodeStorage.set(this.id, {
                    prompts: [],
                    selected: new Set(),
                    categories: []
                });
            }

            loadPrompts(this);
            loadCategories(this);

            this.addWidget("button", "Manage Prompts", null, () => showManager(this));

            const textWidget = this.widgets.find(w => w.name === "selected_prompts");
            if (textWidget) {
                textWidget.disabled = true;
            }

            this.color = "#2a5a2a";
            this.bgcolor = "#1e3a1e";

            return res;
        };

        nodeType.prototype.serialize = function() {
            const data = originalSerialize ? originalSerialize.apply(this, arguments) : {};
            data.selected = Array.from(this.selectedIndices);
            return data;
        };

        nodeType.prototype.configure = function(data) {
            if (originalConfig) {
                originalConfig.apply(this, arguments);
            }
            if (data.selected) {
                this.selectedIndices = new Set(data.selected);
                const store = nodeStorage.get(this.id);
                if (store) store.selected = new Set(data.selected);
                updateOutput(this);
            }
        };

        const originalDraw = nodeType.prototype.onDrawForeground;
        nodeType.prototype.onDrawForeground = function(ctx) {
            if (originalDraw) {
                originalDraw.apply(this, arguments);
            }

            if (this.selectedIndices && this.selectedIndices.size > 0) {
                ctx.save();
                ctx.font = "bold 14px Arial";
                ctx.fillStyle = "#4CAF50";
                ctx.textAlign = "left";
                ctx.fillText(`✓ ${this.selectedIndices.size}`, 10, this.size[1] - 10);
                ctx.restore();
            }
        };
    }
});

async function loadPrompts(node) {
    try {
        const resp = await fetch("/prompt_manager/prompts");
        const data = await resp.json();
        node.prompts = data;
        const store = nodeStorage.get(node.id);
        if (store) store.prompts = data;
        console.log(`[Akash Prompt Manager] Loaded ${data.length} prompts`);
    } catch (e) {
        console.error("[Akash Prompt Manager] Error loading prompts:", e);
    }
}

async function loadCategories(node) {
    try {
        const resp = await fetch("/prompt_manager/categories");
        const data = await resp.json();
        node.availableCategories = data;
        const store = nodeStorage.get(node.id);
        if (store) store.categories = data;
        console.log(`[Akash Prompt Manager] Loaded ${data.length} categories`);
    } catch (e) {
        console.error("[Akash Prompt Manager] Error loading categories:", e);
    }
}

function showManager(node) {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.75);
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
    `;

    const dialog = document.createElement("div");
    dialog.style.cssText = `
        background: #2b2b2b;
        color: #e0e0e0;
        border: 2px solid #444;
        border-radius: 12px;
        width: 900px;
        height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 8px 40px rgba(0,0,0,0.9);
    `;

    const promptCategories = new Set();
    node.prompts.forEach(p => {
        if (p.categories) {
            p.categories.forEach(cat => promptCategories.add(cat));
        }
    });

    const categoryTabs = Array.from(new Set([...node.availableCategories, ...promptCategories])).sort();

    let currentTab = "All";
    let searchTerm = "";

    dialog.innerHTML = `
        <div style="padding: 25px; border-bottom: 2px solid #444;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2 style="margin: 0; color: #4CAF50; font-size: 26px; font-weight: bold;">📝 Prompt Manager</h2>
                <button id="closeBtn" style="background: #f44336; color: white; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold;">✕ Close</button>
            </div>
            <div style="font-size: 12px; color: #888;">Author: Akash Soni | v1.0.0</div>
        </div>

        <div style="padding: 15px 25px; border-bottom: 1px solid #444; background: #242424;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                <div id="tabsContainer" style="display: flex; gap: 8px; flex-wrap: wrap; flex: 1;"></div>
                <button id="manageCategoriesBtn" style="background: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold; display: flex; align-items: center; gap: 6px;" title="Manage Categories">
                    <span style="font-size: 18px;">⚙️</span>
                    <span>Categories</span>
                </button>
            </div>
            <input type="text" id="searchBox" placeholder="🔍 Search prompts by title or text..." style="width: 100%; padding: 12px; background: #1e1e1e; border: 1px solid #555; color: #fff; border-radius: 6px; font-size: 14px;">
        </div>

        <div id="promptList" style="flex: 1; overflow-y: auto; padding: 15px 25px; background: #1a1a1a;"></div>

        <div style="padding: 20px 25px; border-top: 2px solid #444; background: #2b2b2b;">
            <div style="display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; align-items: center;">
                <button id="addPromptBtn" style="padding: 12px 20px; background: #2196F3; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">➕ Add Prompt</button>
                <button id="selectAllBtn" style="padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Select All</button>
                <button id="deselectAllBtn" style="padding: 10px 20px; background: #FF9800; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Deselect All</button>
                <button id="applyBtn" style="padding: 12px 24px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 15px;">✓ Apply & Close</button>
            </div>
        </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const tabsContainer = dialog.querySelector("#tabsContainer");
    const allTabs = ["All", "Favorites", ...categoryTabs];

    function renderTabs() {
        tabsContainer.innerHTML = "";
        allTabs.forEach(tab => {
            const btn = document.createElement("button");
            btn.textContent = tab;
            btn.style.cssText = `
                padding: 8px 16px;
                background: ${currentTab === tab ? '#4CAF50' : '#444'};
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: ${currentTab === tab ? 'bold' : 'normal'};
                transition: background 0.2s;
            `;
            btn.addEventListener("click", () => {
                currentTab = tab;
                renderTabs();
                renderPromptList();
            });
            tabsContainer.appendChild(btn);
        });
    }

    renderTabs();

    function getFilteredPrompts() {
        let filtered = node.prompts;

        if (currentTab === "Favorites") {
            filtered = filtered.filter(p => p.favorite);
        } else if (currentTab !== "All") {
            filtered = filtered.filter(p => p.categories && p.categories.includes(currentTab));
        }

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            filtered = filtered.filter(p => 
                p.title.toLowerCase().includes(lower) || 
                p.prompt.toLowerCase().includes(lower)
            );
        }

        return filtered;
    }

    function renderPromptList() {
        const listDiv = dialog.querySelector("#promptList");
        listDiv.innerHTML = "";

        const filtered = getFilteredPrompts();

        if (filtered.length === 0) {
            listDiv.innerHTML = "<p style='color: #888; text-align: center; padding: 40px 20px;'>No prompts found. Try a different tab or search term.</p>";
            return;
        }

        filtered.forEach(prompt => {
            const idx = prompt.index;
            const isSelected = node.selectedIndices.has(idx);

            const item = document.createElement("div");
            item.style.cssText = `
                display: flex;
                align-items: flex-start;
                padding: 14px;
                margin: 10px 0;
                background: ${isSelected ? '#1a472a' : '#2b2b2b'};
                border: 2px solid ${isSelected ? '#4CAF50' : '#444'};
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
            `;

            const catPills = prompt.categories.map(cat => 
                `<span style="display: inline-block; background: #555; color: #fff; padding: 3px 8px; border-radius: 12px; font-size: 11px; margin-right: 5px; cursor: pointer;" class="catPill" data-cat="${cat}">${cat}</span>`
            ).join("");

            const favStar = prompt.favorite ? "★" : "☆";

            const hasImage = prompt.image && prompt.image.trim();
            const imageIcon = hasImage ? '🖼️ ' : '';

            item.innerHTML = `
                <input type="checkbox" ${isSelected ? 'checked' : ''} style="margin: 4px 12px 0 0; cursor: pointer; width: 20px; height: 20px;">
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                        <div style="flex: 1;">
                            <strong style="color: #4CAF50; font-size: 16px;" class="promptTitle">${imageIcon}${prompt.title}</strong>
                            <span class="favToggle" data-idx="${idx}" style="margin-left: 10px; font-size: 20px; cursor: pointer; user-select: none;">${favStar}</span>
                            <div style="margin-top: 6px;">${catPills}</div>
                        </div>
                        <div style="display: flex; gap: 6px;">
                            <button class="editBtn" data-idx="${idx}" style="padding: 5px 12px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Edit</button>
                            <button class="deleteBtn" data-idx="${idx}" style="padding: 5px 12px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Delete</button>
                        </div>
                    </div>
                    <div style="color: #aaa; font-size: 13px; line-height: 1.5; max-height: 70px; overflow: hidden; text-overflow: ellipsis; font-family: monospace; background: #1a1a1a; padding: 8px; border-radius: 4px;">${prompt.prompt}</div>
                </div>
            `;

            if (hasImage) {
                const titleEl = item.querySelector('.promptTitle');
                let previewTimeout;
                let previewEl;

                titleEl.addEventListener("mouseenter", (e) => {
                    previewTimeout = setTimeout(() => {
                        previewEl = document.createElement("div");
                        previewEl.style.cssText = `
                            position: fixed;
                            z-index: 10002;
                            background: #1a1a1a;
                            border: 2px solid #4CAF50;
                            border-radius: 8px;
                            padding: 8px;
                            box-shadow: 0 4px 20px rgba(0,0,0,0.8);
                            pointer-events: none;
                        `;

                        const img = document.createElement("img");
                        img.src = `/prompt_manager/image/${prompt.image}`;
                        img.style.cssText = "max-width: 200px; max-height: 200px; display: block; border-radius: 4px;";
                        img.onerror = () => { if (previewEl && previewEl.parentNode) document.body.removeChild(previewEl); };

                        previewEl.appendChild(img);
                        document.body.appendChild(previewEl);

                        const rect = titleEl.getBoundingClientRect();
                        previewEl.style.left = (rect.left + 20) + 'px';
                        previewEl.style.top = (rect.bottom + 5) + 'px';
                    }, 500);
                });

                titleEl.addEventListener("mouseleave", () => {
                    clearTimeout(previewTimeout);
                    if (previewEl && previewEl.parentNode) {
                        document.body.removeChild(previewEl);
                        previewEl = null;
                    }
                });
            }

            item.addEventListener("click", (e) => {
                if (e.target.classList.contains('editBtn') || 
                    e.target.classList.contains('deleteBtn') ||
                    e.target.classList.contains('favToggle') ||
                    e.target.classList.contains('catPill') ||
                    e.target.classList.contains('promptTitle')) {
                    return;
                }

                if (node.selectedIndices.has(idx)) {
                    node.selectedIndices.delete(idx);
                } else {
                    node.selectedIndices.add(idx);
                }
                renderPromptList();
            });

            item.querySelector('.favToggle').addEventListener("click", async (e) => {
                e.stopPropagation();
                prompt.favorite = !prompt.favorite;
                await updatePromptOnServer(prompt);
                await loadPrompts(node);
                renderPromptList();
            });

            item.querySelectorAll('.catPill').forEach(pill => {
                pill.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const cat = e.target.getAttribute('data-cat');
                    currentTab = cat;
                    renderTabs();
                    renderPromptList();
                });
            });

            item.querySelector('.editBtn').addEventListener("click", (e) => {
                e.stopPropagation();
                showEditDialog(node, prompt, dialog, async () => {
                    await loadPrompts(node);
                    await loadCategories(node);
                    renderTabs();
                    renderPromptList();
                });
            });

            item.querySelector('.deleteBtn').addEventListener("click", async (e) => {
                e.stopPropagation();
                if (confirm(`Delete prompt "${prompt.title}"?`)) {
                    try {
                        const resp = await fetch('/prompt_manager/delete', {
                            method: 'DELETE',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({index: idx})
                        });
                        if (resp.ok) {
                            await loadPrompts(node);
                            node.selectedIndices.delete(idx);
                            renderPromptList();
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }
            });

            listDiv.appendChild(item);
        });
    }

    renderPromptList();

    dialog.querySelector("#searchBox").addEventListener("input", (e) => {
        searchTerm = e.target.value.toLowerCase();
        renderPromptList();
    });

    dialog.querySelector("#manageCategoriesBtn").addEventListener("click", () => {
        showManageCategoriesDialog(node, () => {
            loadCategories(node).then(() => {
                renderTabs();
                renderPromptList();
            });
        });
    });

    dialog.querySelector("#addPromptBtn").addEventListener("click", () => {
        showAddDialog(node, dialog, async () => {
            await loadPrompts(node);
            await loadCategories(node);
            renderTabs();
            renderPromptList();
        });
    });

    dialog.querySelector("#selectAllBtn").addEventListener("click", () => {
        const filtered = getFilteredPrompts();
        filtered.forEach(p => node.selectedIndices.add(p.index));
        renderPromptList();
    });

    dialog.querySelector("#deselectAllBtn").addEventListener("click", () => {
        node.selectedIndices.clear();
        renderPromptList();
    });

    dialog.querySelector("#applyBtn").addEventListener("click", () => {
        updateOutput(node);
        document.body.removeChild(overlay);
    });

    dialog.querySelector("#closeBtn").addEventListener("click", () => {
        document.body.removeChild(overlay);
    });

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });
}

function showManageCategoriesDialog(node, onSuccess) {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        z-index: 10001;
        display: flex;
        justify-content: center;
        align-items: center;
    `;

    const dialog = document.createElement("div");
    dialog.style.cssText = `
        background: #2b2b2b;
        color: #e0e0e0;
        border: 2px solid #2196F3;
        border-radius: 10px;
        padding: 25px;
        width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 8px 40px rgba(0,0,0,0.95);
    `;

    function renderCategoryList() {
        const catList = node.availableCategories.map(cat => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; margin: 8px 0; background: #1e1e1e; border-radius: 6px;">
                <span style="font-size: 15px;">${cat}</span>
                <button class="deleteCatBtn" data-cat="${cat}" style="padding: 6px 12px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Delete</button>
            </div>
        `).join("");

        dialog.innerHTML = `
            <h3 style="margin: 0 0 20px 0; color: #2196F3; font-size: 22px;">⚙️ Manage Categories</h3>
            <div style="margin-bottom: 20px;">
                <input type="text" id="newCategory" placeholder="Enter new category name..." style="width: 70%; padding: 10px; background: #1e1e1e; border: 1px solid #555; color: #fff; border-radius: 5px; margin-right: 10px;">
                <button id="addCategoryBtn" style="padding: 10px 16px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">+ Add</button>
            </div>
            <div style="max-height: 400px; overflow-y: auto;">
                ${catList || '<p style="color: #888; text-align: center; padding: 20px;">No categories yet.</p>'}
            </div>
            <div style="margin-top: 20px; text-align: center;">
                <button id="closeCatDialog" style="padding: 10px 24px; background: #666; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Close</button>
            </div>
        `;

        dialog.querySelectorAll('.deleteCatBtn').forEach(btn => {
            btn.addEventListener("click", async () => {
                const cat = btn.getAttribute('data-cat');
                if (confirm(`Delete category "${cat}"? (Prompts using this category will keep it)`)) {
                    try {
                        const resp = await fetch('/prompt_manager/categories/delete', {
                            method: 'DELETE',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({category: cat})
                        });
                        if (resp.ok) {
                            await loadCategories(node);
                            renderCategoryList();
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }
            });
        });

        const addBtn = dialog.querySelector("#addCategoryBtn");
        const input = dialog.querySelector("#newCategory");

        const addCategory = async () => {
            const cat = input.value.trim().toLowerCase();
            if (!cat) {
                alert("⚠️ Please enter a category name");
                return;
            }

            try {
                const resp = await fetch('/prompt_manager/categories/add', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({category: cat})
                });
                if (resp.ok) {
                    await loadCategories(node);
                    input.value = "";
                    renderCategoryList();
                }
            } catch (error) {
                console.error(error);
            }
        };

        addBtn.addEventListener("click", addCategory);
        input.addEventListener("keypress", (e) => {
            if (e.key === 'Enter') addCategory();
        });

        dialog.querySelector("#closeCatDialog").addEventListener("click", () => {
            document.body.removeChild(overlay);
            if (onSuccess) onSuccess();
        });
    }

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    renderCategoryList();
}

async function updatePromptOnServer(prompt) {
    try {
        await fetch('/prompt_manager/update', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                index: prompt.index,
                title: prompt.title,
                categories: prompt.categories,
                favorite: prompt.favorite,
                image: prompt.image,
                prompt: prompt.prompt
            })
        });
    } catch (e) {
        console.error(e);
    }
}

async function uploadImage(file, promptIndex) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('index', promptIndex);

        const resp = await fetch('/prompt_manager/upload_image', {
            method: 'POST',
            body: formData
        });

        if (resp.ok) {
            const data = await resp.json();
            return data.filename;
        }
        return null;
    } catch (e) {
        console.error(e);
        return null;
    }
}

function showAddDialog(node, parentDialog, onSuccess) {
    const addOverlay = document.createElement("div");
    addOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        z-index: 10001;
        display: flex;
        justify-content: center;
        align-items: center;
    `;

    const addDialog = document.createElement("div");
    addDialog.style.cssText = `
        background: #2b2b2b;
        color: #e0e0e0;
        border: 2px solid #4CAF50;
        border-radius: 10px;
        padding: 25px;
        width: 650px;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 8px 40px rgba(0,0,0,0.95);
    `;

    const catOptions = node.availableCategories.map(c => `<option value="${c}">${c}</option>`).join("");

    addDialog.innerHTML = `
        <h3 style="margin: 0 0 20px 0; color: #4CAF50; font-size: 22px;">➕ Add New Prompt</h3>
        <input type="text" id="addTitle" placeholder="Title (e.g., 'Confident Standing')" style="width: 100%; padding: 10px; margin: 10px 0; background: #1e1e1e; border: 1px solid #555; color: #fff; border-radius: 5px;">

        <div style="margin: 10px 0;">
            <label style="display: block; margin-bottom: 5px; color: #aaa;">Categories (select multiple):</label>
            <select id="addCategories" multiple style="width: 100%; padding: 10px; background: #1e1e1e; border: 1px solid #555; color: #fff; border-radius: 5px; min-height: 100px;">
                ${catOptions}
            </select>
            <div style="font-size: 12px; color: #888; margin-top: 5px;">Hold Ctrl/Cmd to select multiple</div>
        </div>

        <label style="display: flex; align-items: center; margin: 12px 0; cursor: pointer;">
            <input type="checkbox" id="addFavorite" style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
            <span style="font-size: 16px;">★ Mark as Favorite</span>
        </label>

        <div style="margin: 15px 0;">
            <label style="display: block; margin-bottom: 5px; color: #aaa;">Preview Image (optional):</label>
            <input type="file" id="addImage" accept="image/*" style="width: 100%; padding: 10px; background: #1e1e1e; border: 1px solid #555; color: #fff; border-radius: 5px;">
            <div style="font-size: 12px; color: #888; margin-top: 5px;">Supported: JPG, PNG, WebP (max 5MB)</div>
            <div id="imagePreview" style="margin-top: 10px;"></div>
        </div>

        <textarea id="addPrompt" placeholder="Enter prompt text..." rows="6" style="width: 100%; padding: 10px; margin: 10px 0; background: #1e1e1e; border: 1px solid #555; color: #fff; border-radius: 5px; resize: vertical; font-family: monospace;"></textarea>
        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
            <button id="cancelAddBtn" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Cancel</button>
            <button id="saveAddBtn" style="padding: 10px 24px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">✓ Add</button>
        </div>
    `;

    addOverlay.appendChild(addDialog);
    document.body.appendChild(addOverlay);

    const imageInput = addDialog.querySelector("#addImage");
    const imagePreview = addDialog.querySelector("#imagePreview");

    imageInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                imagePreview.innerHTML = `<img src="${ev.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 6px; border: 2px solid #444;">`;
            };
            reader.readAsDataURL(file);
        } else {
            imagePreview.innerHTML = "";
        }
    });

    addDialog.querySelector("#saveAddBtn").addEventListener("click", async () => {
        const title = addDialog.querySelector("#addTitle").value.trim();
        const select = addDialog.querySelector("#addCategories");
        const cats = Array.from(select.selectedOptions).map(opt => opt.value);
        const fav = addDialog.querySelector("#addFavorite").checked;
        const promptText = addDialog.querySelector("#addPrompt").value.trim();
        const imageFile = imageInput.files[0];

        if (!title || !promptText) {
            alert("⚠️ Title and prompt text are required");
            return;
        }

        let imageName = null;

        try {
            const resp = await fetch('/prompt_manager/add', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({title, categories: cats, favorite: fav, image: null, prompt: promptText})
            });

            if (resp.ok) {
                const data = await resp.json();
                const newIndex = data.index;

                if (imageFile) {
                    imageName = await uploadImage(imageFile, newIndex);
                    if (imageName) {
                        await fetch('/prompt_manager/update', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({
                                index: newIndex,
                                title,
                                categories: cats,
                                favorite: fav,
                                image: imageName,
                                prompt: promptText
                            })
                        });
                    }
                }

                document.body.removeChild(addOverlay);
                if (onSuccess) onSuccess();
            } else {
                alert("❌ Failed to add prompt");
            }
        } catch (error) {
            console.error(error);
            alert("❌ Error adding prompt");
        }
    });

    addDialog.querySelector("#cancelAddBtn").addEventListener("click", () => {
        document.body.removeChild(addOverlay);
    });
}

function showEditDialog(node, prompt, parentDialog, onSuccess) {
    const editOverlay = document.createElement("div");
    editOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        z-index: 10001;
        display: flex;
        justify-content: center;
        align-items: center;
    `;

    const editDialog = document.createElement("div");
    editDialog.style.cssText = `
        background: #2b2b2b;
        color: #e0e0e0;
        border: 2px solid #4CAF50;
        border-radius: 10px;
        padding: 25px;
        width: 650px;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 8px 40px rgba(0,0,0,0.95);
    `;

    const catOptions = node.availableCategories.map(c => {
        const selected = prompt.categories.includes(c) ? 'selected' : '';
        return `<option value="${c}" ${selected}>${c}</option>`;
    }).join("");

    const currentImage = prompt.image ? `/prompt_manager/image/${prompt.image}` : '';
    const imagePreviewHtml = currentImage ? 
        `<div style="margin-top: 10px;"><img src="${currentImage}" style="max-width: 200px; max-height: 200px; border-radius: 6px; border: 2px solid #444;"></div>` : '';

    editDialog.innerHTML = `
        <h3 style="margin: 0 0 20px 0; color: #4CAF50; font-size: 22px;">✏️ Edit Prompt</h3>
        <input type="text" id="editTitle" value="${prompt.title}" style="width: 100%; padding: 10px; margin: 10px 0; background: #1e1e1e; border: 1px solid #555; color: #fff; border-radius: 5px;">

        <div style="margin: 10px 0;">
            <label style="display: block; margin-bottom: 5px; color: #aaa;">Categories (select multiple):</label>
            <select id="editCategories" multiple style="width: 100%; padding: 10px; background: #1e1e1e; border: 1px solid #555; color: #fff; border-radius: 5px; min-height: 100px;">
                ${catOptions}
            </select>
            <div style="font-size: 12px; color: #888; margin-top: 5px;">Hold Ctrl/Cmd to select multiple</div>
        </div>

        <label style="display: flex; align-items: center; margin: 12px 0; cursor: pointer;">
            <input type="checkbox" id="editFavorite" ${prompt.favorite ? 'checked' : ''} style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
            <span style="font-size: 16px;">★ Favorite</span>
        </label>

        <div style="margin: 15px 0;">
            <label style="display: block; margin-bottom: 5px; color: #aaa;">Preview Image:</label>
            <div style="display: flex; gap: 10px; align-items: center;">
                <input type="file" id="editImage" accept="image/*" style="flex: 1; padding: 10px; background: #1e1e1e; border: 1px solid #555; color: #fff; border-radius: 5px;">
                ${prompt.image ? '<button id="removeImageBtn" style="padding: 10px 16px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">Remove</button>' : ''}
            </div>
            <div id="imagePreview">${imagePreviewHtml}</div>
        </div>

        <textarea id="editPrompt" rows="6" style="width: 100%; padding: 10px; margin: 10px 0; background: #1e1e1e; border: 1px solid #555; color: #fff; border-radius: 5px; resize: vertical; font-family: monospace;">${prompt.prompt}</textarea>
        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
            <button id="cancelEditBtn" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Cancel</button>
            <button id="saveEditBtn" style="padding: 10px 24px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">💾 Save</button>
        </div>
    `;

    editOverlay.appendChild(editDialog);
    document.body.appendChild(editOverlay);

    const imageInput = editDialog.querySelector("#editImage");
    const imagePreview = editDialog.querySelector("#imagePreview");
    let newImageFile = null;
    let removeImage = false;

    imageInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            newImageFile = file;
            const reader = new FileReader();
            reader.onload = (ev) => {
                imagePreview.innerHTML = `<div style="margin-top: 10px;"><img src="${ev.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 6px; border: 2px solid #4CAF50;"></div>`;
            };
            reader.readAsDataURL(file);
        }
    });

    const removeBtn = editDialog.querySelector("#removeImageBtn");
    if (removeBtn) {
        removeBtn.addEventListener("click", async () => {
            if (confirm("Remove preview image?")) {
                removeImage = true;
                imagePreview.innerHTML = '<div style="margin-top: 10px; color: #888;">Image will be removed on save</div>';
            }
        });
    }

    editDialog.querySelector("#saveEditBtn").addEventListener("click", async () => {
        const title = editDialog.querySelector("#editTitle").value.trim();
        const select = editDialog.querySelector("#editCategories");
        const cats = Array.from(select.selectedOptions).map(opt => opt.value);
        const fav = editDialog.querySelector("#editFavorite").checked;
        const promptText = editDialog.querySelector("#editPrompt").value.trim();

        if (!title || !promptText) {
            alert("⚠️ Title and prompt cannot be empty");
            return;
        }

        let finalImageName = prompt.image;

        if (removeImage) {
            if (prompt.image) {
                await fetch('/prompt_manager/image/delete', {
                    method: 'DELETE',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({filename: prompt.image})
                });
            }
            finalImageName = null;
        } else if (newImageFile) {
            if (prompt.image) {
                await fetch('/prompt_manager/image/delete', {
                    method: 'DELETE',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({filename: prompt.image})
                });
            }
            finalImageName = await uploadImage(newImageFile, prompt.index);
        }

        try {
            const resp = await fetch('/prompt_manager/update', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    index: prompt.index,
                    title,
                    categories: cats,
                    favorite: fav,
                    image: finalImageName,
                    prompt: promptText
                })
            });

            if (resp.ok) {
                document.body.removeChild(editOverlay);
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            console.error(error);
        }
    });

    editDialog.querySelector("#cancelEditBtn").addEventListener("click", () => {
        document.body.removeChild(editOverlay);
    });
}

function updateOutput(node) {
    const selectedPrompts = Array.from(node.selectedIndices)
        .sort((a, b) => a - b)
        .map(idx => {
            const p = node.prompts.find(pr => pr.index === idx);
            return p ? p.prompt : null;
        })
        .filter(p => p);

    const output = selectedPrompts.join("\n");

    const textWidget = node.widgets.find(w => w.name === "selected_prompts");
    if (textWidget) {
        textWidget.value = output;
    }

    node.setDirtyCanvas(true, true);

    console.log(`[Akash Prompt Manager] Output: ${selectedPrompts.length} prompts`);
}
