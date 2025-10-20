# Akash's Prompt Manager

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![ComfyUI](https://img.shields.io/badge/ComfyUI-Compatible-orange.svg)

**A powerful prompt management system for ComfyUI with Favorites, Categories, and Image Previews**

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Use Cases](#-use-cases) • [API](#-api-reference) • [Contributing](#-contributing)

</div>

---

## 📝 Overview

Prompt Manager is a professional-grade ComfyUI custom node that revolutionizes prompt management. Organize, categorize, and reuse your prompts with ease. Perfect for artists, designers, and AI enthusiasts who work with multiple prompts daily.

**Author:** Akash Soni  
**GitHub:** https://github.com/akashsoni1102/akash_prompt_manager.git  
**Node Location:** Akash Nodes > Prompt Manager  
**Node Title:** Prompt Manager

---

## ✨ Features

### Core Functionality
- ⭐ **Favorites System** - Star your most-used prompts for quick access
- 🏷️ **Multi-Category Tagging** - Organize prompts with multiple categories
- 📑 **Dynamic Tabs** - Navigate between All, Favorites, and Category views
- 🔍 **Real-time Search** - Instantly filter prompts by title or content
- 🏷️ **Category Pills** - Click category tags to filter instantly
- ☑️ **Multi-Select** - Select multiple prompts with checkboxes
- 💾 **Persistent State** - Selections saved in your workflow

### Advanced Features
- 🖼️ **Image Previews** - Upload preview images for each prompt
- 👁️ **Hover Preview** - See preview on mouse hover (500ms delay)
- ⚙️ **Category Management** - Add/delete categories with ease
- 📥 **Image Upload** - Support for JPG, PNG, WebP (max 5MB)
- 🗑️ **Safe Delete** - Remove categories without affecting prompts
- 📌 **Sticky Footer** - Action buttons always visible
- 📋 **Category Dropdown** - Multi-select categories when adding/editing

### User Experience
- 🎨 Modern dark theme interface
- 🚀 Fast and responsive
- 📱 Responsive design
- 🔒 Local-only storage (privacy-focused)
- 🛠️ RESTful API backend

---

## 📦 Installation

### Method 1: ComfyUI Manager (Recommended)

1. Open ComfyUI
2. Go to **Manager > Custom Nodes Manager**
3. Search for "**akash prompt manager**"
4. Click **Install**
5. Restart ComfyUI

### Method 2: Manual Installation

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/akashsoni1102/akash_prompt_manager.git
# Restart ComfyUI
```

### Method 3: Download ZIP

1. Download latest release from [Releases](https://github.com/akashsoni1102/akash_prompt_manager/releases)
2. Extract to `ComfyUI/custom_nodes/`
3. Restart ComfyUI

### Verification

1. Open ComfyUI
2. Right-click on canvas
3. Navigate: **Akash Nodes → Prompt Manager**
4. Node titled "**Prompt Manager**" should appear

---

## 🚀 Quick Start

### Basic Usage

1. **Add Node**
   - Right-click canvas → Akash Nodes → Prompt Manager
   - Node appears as "Prompt Manager"

2. **Open Manager**
   - Click "Manage Prompts" button on node

3. **Select Prompts**
   - Click prompt rows to toggle selection
   - Selected prompts show green border

4. **Apply**
   - Click "✓ Apply & Close" (always visible in footer)
   - Prompts concatenated with newlines

5. **Connect**
   - Connect output to CLIP Text Encode or any STRING input

---

## 💡 Use Cases

### 1. Character Design Workflow

**Scenario:** You're creating multiple character variations

**Steps:**
1. Create categories: `character`, `emotions`, `poses`, `outfits`
2. Add prompts for each variation:
   - "Confident Hero | character,poses | 1girl, standing, confident..."
   - "Sad Expression | character,emotions | 1girl, crying, sad..."
3. Upload reference images for each prompt
4. Select multiple prompts to combine styles
5. Apply and generate

**Benefits:**
- Quick access to character presets
- Consistent character across generations
- Easy mixing of attributes

### 2. Style Experimentation

**Scenario:** Testing different art styles

**Steps:**
1. Create categories: `style`, `lighting`, `composition`
2. Add style prompts:
   - "Anime Style | style | anime, cel shaded, vibrant..."
   - "Realistic Style | style | photorealistic, detailed..."
3. Star your favorite styles
4. Mix styles with composition and lighting prompts
5. Generate variations

**Benefits:**
- Compare styles side-by-side
- Combine multiple style elements
- Save successful combinations

### 3. Product Photography

**Scenario:** Generating product images with different backgrounds

**Steps:**
1. Categories: `product`, `background`, `lighting`, `angles`
2. Add prompts:
   - "White Studio | background,lighting | white background, studio lighting..."
   - "Outdoor Scene | background | outdoor, natural light..."
3. Upload sample product images
4. Select product + background + angle
5. Generate variations

**Benefits:**
- Consistent product representation
- Easy background switching
- Professional results

### 4. Batch Generation

**Scenario:** Creating a series of related images

**Steps:**
1. Create project category: `summer_collection`
2. Add all related prompts with previews
3. Use "Select All" for the category
4. Generate entire series
5. Review and refine

**Benefits:**
- Cohesive series generation
- Time-saving batch operations
- Easy series management

### 5. Client Work

**Scenario:** Managing prompts for multiple clients

**Steps:**
1. Create client categories: `client_a`, `client_b`
2. Add client-specific prompts and preferences
3. Upload client references as previews
4. Switch between clients using category tabs
5. Generate client-specific content

**Benefits:**
- Organized client separation
- Quick client switching
- Professional workflow

---

## 📖 Detailed Usage

### Managing Prompts

#### Add New Prompt

1. Click "➕ Add Prompt" in footer
2. Enter **Title** (e.g., "Confident Standing")
3. Select **Categories** (hold Ctrl/Cmd for multiple)
4. Check **★ Mark as Favorite** if desired
5. **Upload Image** (optional):
   - Click "Choose File"
   - Supported: JPG, PNG, WebP (max 5MB)
   - Preview shows immediately
6. Enter **Prompt Text**
7. Click "✓ Add"

#### Edit Prompt

1. Click "Edit" button on any prompt
2. Modify any field
3. **Change Image**:
   - Choose new file to replace
   - Or click "Remove" to delete
4. Click "💾 Save"

#### Delete Prompt

1. Click "Delete" button
2. Confirm deletion
3. Prompt and associated image removed

### Managing Categories

#### Open Category Manager

- Click "⚙️ Categories" button next to tabs

#### Add Category

1. Enter category name in text field
2. Click "+ Add" or press Enter
3. Category immediately appears in tabs
4. Available in all dropdowns

#### Delete Category

1. Click "Delete" next to category
2. Confirm deletion
3. **Note:** Prompts keep their categories (safe delete)

### Using Images

#### Upload Preview Image

- In add/edit dialog
- Click "Choose File" or drag-and-drop
- Preview shows below file input
- Images saved to `preview_images/` folder

#### View Preview on Hover

- Prompts with images show 🖼️ icon
- Hover over prompt title
- After 500ms, preview appears (200x200px)
- Preview disappears when mouse leaves

#### Change/Remove Image

- **Change**: Upload new file in edit dialog
- **Remove**: Click "Remove" button
- Images stored as `prompt_{index}.{ext}`

### Organizing with Categories

#### Using Category Tabs

- Click any tab to filter (All/Favorites/Categories)
- Click category pill on prompt to filter
- Tabs update automatically when categories added

#### Multi-Category Prompts

- Select multiple categories in dropdown
- Hold Ctrl (Windows/Linux) or Cmd (Mac)
- Prompt appears in all selected category tabs

### Search & Filter

#### Using Search

- Type in search box at top
- Searches titles and prompt text
- Works within current tab
- Real-time filtering

#### Combining Filters

- Select category tab
- Then use search box
- Get precise results

### Selection & Output

#### Select Prompts

- Click anywhere on prompt row
- Checkbox toggles automatically
- Green border = selected

#### Bulk Actions

- **Select All**: Selects all in current view
- **Deselect All**: Clears all selections
- Works within tab/search filter

#### Apply Selections

- Click "✓ Apply & Close" (sticky footer)
- Selected prompts concatenated with newlines
- Output updates immediately
- Connect to CLIP Text Encode

---

## 📄 File Format

### Prompts Storage

File: `prompts.txt`

Format:
```
INDEX. TITLE | cat1,cat2 | ★? | image.png | PROMPT_TEXT
```

Example:
```
1. Confident Stand | poses | ★ | prompt_1.png | 1girl, full body, standing, masterpiece
2. Gentle Smile | portraits,emotions |  |  | close-up, 1girl, soft smile, white bg
```

### Categories Storage

File: `categories.json`

Format:
```json
[
  "actions",
  "emotions",
  "poses",
  "portraits"
]
```

### Images Storage

Folder: `preview_images/`

Format: `prompt_{index}.{ext}`

Examples:
- `prompt_1.png`
- `prompt_2.jpg`
- `prompt_3.webp`

---

## 🔧 API Reference

### Base URL
`/prompt_manager/`

### Endpoints

#### Prompts

**Get All Prompts**
```
GET /prompts
Response: Array of prompt objects
```

**Add Prompt**
```
POST /add
Body: {title, categories[], favorite, image, prompt}
Response: {status, index}
```

**Update Prompt**
```
POST /update
Body: {index, title, categories[], favorite, image, prompt}
Response: {status}
```

**Delete Prompt**
```
DELETE /delete
Body: {index}
Response: {status, deleted}
```

#### Categories

**Get Categories**
```
GET /categories
Response: Array of category strings
```

**Add Category**
```
POST /categories/add
Body: {category}
Response: {status, categories[]}
```

**Delete Category**
```
DELETE /categories/delete
Body: {category}
Response: {status, categories[]}
```

#### Images

**Upload Image**
```
POST /upload_image
Body: FormData {file, index}
Response: {status, filename}
```

**Get Image**
```
GET /image/{filename}
Response: Image file
```

**Delete Image**
```
DELETE /image/delete
Body: {filename}
Response: {status}
```

---

## 🛠️ Development

### File Structure

```
akash_prompt_manager/
├── __init__.py              # Node registration
├── nodes.py                 # Python backend (500+ lines)
├── prompts.txt              # Prompt storage
├── categories.json          # Category list
├── preview_images/          # Image storage
│   └── README.txt
├── js/
│   └── prompt_manager.js    # Frontend (850+ lines)
├── README.md
├── CHANGELOG.md
├── LICENSE
└── .gitignore
```

### Technologies

- **Backend**: Python 3.8+, aiohttp
- **Frontend**: Vanilla JavaScript, ComfyUI API
- **Storage**: Text files, JSON
- **No external dependencies**

---

## 🐛 Troubleshooting

### Node Not Appearing

**Check:**
- Folder in `ComfyUI/custom_nodes/akash_prompt_manager/`
- Restart ComfyUI completely
- Look under: Akash Nodes → Prompt Manager
- Check terminal for errors

### Images Not Showing

**Solutions:**
- Verify `preview_images/` folder exists
- Check image format (JPG/PNG/WebP)
- Check file permissions
- Browser console (F12) for errors

### Categories Not Updating

**Solutions:**
- Click "⚙️ Categories" to manage
- Categories appear immediately after adding
- Check `categories.json` file

### Hover Preview Not Working

**Check:**
- Image uploaded (🖼️ icon visible)
- Wait 500ms after hover
- Image exists in `preview_images/`
- Browser console for errors

---

## 📈 Roadmap

### v1.1.0 (Planned)
- [ ] Import/Export prompts (CSV, JSON)
- [ ] Bulk actions (bulk favorite, bulk delete)
- [ ] Drag-and-drop reordering
- [ ] Custom sort options

### v1.2.0 (Planned)
- [ ] Prompt versioning and history
- [ ] Undo/Redo functionality
- [ ] Prompt templates
- [ ] Syntax highlighting

### v1.3.0 (Planned)
- [ ] Keyboard shortcuts
- [ ] Theme toggle (dark/light)
- [ ] Advanced filters
- [ ] Statistics dashboard

---

## 📝 License

GNU GENERAL PUBLIC LICENSE - see [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Akash Soni

---

## 🙏 Acknowledgments

- Inspired by ComfyUI-Lora-Manager
- Built for the ComfyUI community
- Thanks to all contributors and testers

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/akashsoni1102/akash_prompt_manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/akashsoni1102/akash_prompt_manager/discussions)
- **Author**: Akash Soni
- **GitHub**: [@akashsoni1102](https://github.com/akashsoni1102)

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by [Akash Soni](https://github.com/akashsoni1102)

</div>
