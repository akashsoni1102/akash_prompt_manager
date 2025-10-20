"""
AKASH_PROMPT_MANAGER - Backend API
Handles prompt storage, category management, image uploads, and RESTful endpoints.

Author: Akash Soni
GitHub: https://github.com/akashsoni1102/akash_prompt_manager
Version: 1.0.0
"""

import os
import json
import base64
from pathlib import Path
from server import PromptServer
from aiohttp import web
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# File paths
PROMPTS_FILE = Path(__file__).parent / "prompts.txt"
CATEGORIES_FILE = Path(__file__).parent / "categories.json"
PREVIEW_DIR = Path(__file__).parent / "preview_images"

# Ensure preview directory exists
PREVIEW_DIR.mkdir(exist_ok=True)

def load_categories():
    """Load category list from JSON file."""
    if not CATEGORIES_FILE.exists():
        default_cats = ["poses", "emotions", "portraits", "lighting", "actions", "outfits", "backgrounds", "angles"]
        save_categories(default_cats)
        return default_cats

    try:
        with open(CATEGORIES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return ["poses", "emotions", "portraits"]

def save_categories(categories):
    """Save category list to JSON file."""
    with open(CATEGORIES_FILE, 'w', encoding='utf-8') as f:
        json.dump(sorted(set(categories)), f, indent=2, ensure_ascii=False)
    logger.info(f"Saved {len(categories)} categories")

def parse_line(line):
    """
    Parse: INDEX. TITLE | cat1,cat2 | ★? | image.png | PROMPT_TEXT
    Returns dict or None if malformed
    """
    line = line.strip()
    if not line or "|" not in line:
        return None

    parts = [p.strip() for p in line.split("|")]
    if len(parts) < 4:
        return None

    idx_title = parts[0]
    cats_str = parts[1]
    fav_str = parts[2]

    # Check if we have image field (5 parts) or not (4 parts)
    if len(parts) == 5:
        image_str = parts[3]
        prompt_text = parts[4]
    else:
        image_str = ""
        prompt_text = parts[3]

    # Parse categories
    cats = [c.strip() for c in cats_str.split(",") if c.strip()]

    # Parse favorite
    fav = (fav_str == "★")

    # Extract index and title
    if ". " not in idx_title:
        return None

    try:
        idx_str, title = idx_title.split(". ", 1)
        idx = int(idx_str)
    except:
        return None

    return {
        "index": idx,
        "title": title,
        "categories": cats,
        "favorite": fav,
        "image": image_str if image_str else None,
        "prompt": prompt_text
    }

def format_lines(prompts):
    """Format prompt dicts back to file lines."""
    lines = []
    for p in prompts:
        flag = "★" if p.get("favorite", False) else ""
        cats = ",".join(p.get("categories", []))
        title = p.get("title", "Untitled")
        image = p.get("image", "") or ""
        prompt = p.get("prompt", "")
        idx = p.get("index", 0)
        lines.append(f'{idx}. {title} | {cats} | {flag} | {image} | {prompt}')
    return "\n".join(lines)

def load_all_prompts():
    """Read and parse all prompts from file."""
    if not PROMPTS_FILE.exists():
        create_default_prompts()

    lines = PROMPTS_FILE.read_text(encoding="utf-8").splitlines()
    prompts = []
    for line in lines:
        parsed = parse_line(line)
        if parsed:
            prompts.append(parsed)
    return prompts

def save_all_prompts(prompts):
    """Write all prompts list back to file. Re-indexes sequentially."""
    for i, p in enumerate(prompts, start=1):
        p["index"] = i
    content = format_lines(prompts)
    PROMPTS_FILE.write_text(content, encoding="utf-8")
    logger.info(f"Saved {len(prompts)} prompts")

def create_default_prompts():
    """Create default prompts file"""
    default = [
        {
            "index": 1,
            "title": "Confident Stand",
            "categories": ["poses"],
            "favorite": True,
            "image": None,
            "prompt": "1girl, full body, white background, standing pose, hand on hip, confident smirk, long hair flowing, lingerie, high heels, seductive lighting, masterpiece, best quality"
        },
        {
            "index": 2,
            "title": "Gentle Kneel",
            "categories": ["poses", "emotions"],
            "favorite": False,
            "image": None,
            "prompt": "1girl, white background, full body, kneeling pose, head tilted, emotional eyes, gentle smile, silk nightwear, soft lighting, seductive vibe, best quality"
        },
        {
            "index": 3,
            "title": "Sultry Gaze",
            "categories": ["portraits", "emotions"],
            "favorite": True,
            "image": None,
            "prompt": "close-up, 1girl, half-lidded eyes, pout, white background, soft lighting, seductive, detailed face, masterpiece"
        },
    ]
    save_all_prompts(default)
    logger.info("Created default prompts file")

class PromptManagerNode:
    """
    ComfyUI Node: Prompt Manager
    Author: Akash Soni
    Version: 1.0.0
    """
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "selected_prompts": ("STRING", {
                    "multiline": True,
                    "default": "",
                    "dynamicPrompts": False
                }),
            },
            "hidden": {
                "unique_id": "UNIQUE_ID",
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("prompt",)
    FUNCTION = "process_prompts"
    CATEGORY = "Akash Nodes/Prompt Manager"
    OUTPUT_NODE = False

    def process_prompts(self, selected_prompts, unique_id=None):
        """Return selected_prompts directly."""
        return (selected_prompts,)


# ============================================================================
# API Endpoints
# ============================================================================

@PromptServer.instance.routes.get("/prompt_manager/prompts")
async def get_prompts(request):
    """Get all prompt objects."""
    try:
        prompts = load_all_prompts()
        return web.json_response(prompts)
    except Exception as e:
        logger.error(f"Error loading prompts: {e}")
        return web.json_response({"error": str(e)}, status=500)

@PromptServer.instance.routes.get("/prompt_manager/categories")
async def get_categories(request):
    """Get all available categories."""
    try:
        categories = load_categories()
        return web.json_response(categories)
    except Exception as e:
        logger.error(f"Error loading categories: {e}")
        return web.json_response({"error": str(e)}, status=500)

@PromptServer.instance.routes.post("/prompt_manager/categories/add")
async def add_category(request):
    """Add a new category."""
    try:
        data = await request.json()
        category = data.get("category", "").strip().lower()

        if not category:
            return web.json_response({
                "status": "error",
                "message": "Category name required"
            }, status=400)

        categories = load_categories()
        if category not in categories:
            categories.append(category)
            save_categories(categories)
            logger.info(f"Added category: {category}")

        return web.json_response({"status": "success", "categories": sorted(categories)})
    except Exception as e:
        logger.error(f"Error adding category: {e}")
        return web.json_response({"status": "error", "message": str(e)}, status=500)

@PromptServer.instance.routes.delete("/prompt_manager/categories/delete")
async def delete_category(request):
    """Delete a category (doesn't affect prompts using it)."""
    try:
        data = await request.json()
        category = data.get("category", "").strip().lower()

        if not category:
            return web.json_response({
                "status": "error",
                "message": "Category name required"
            }, status=400)

        categories = load_categories()
        if category in categories:
            categories.remove(category)
            save_categories(categories)
            logger.info(f"Deleted category: {category}")

        return web.json_response({"status": "success", "categories": sorted(categories)})
    except Exception as e:
        logger.error(f"Error deleting category: {e}")
        return web.json_response({"status": "error", "message": str(e)}, status=500)

@PromptServer.instance.routes.post("/prompt_manager/upload_image")
async def upload_image(request):
    """Upload and save preview image."""
    try:
        data = await request.post()
        file_data = data.get("file")
        prompt_index = int(data.get("index", 0))

        if not file_data:
            return web.json_response({"status": "error", "message": "No file provided"}, status=400)

        # Read file content
        content = file_data.file.read()

        # Generate filename
        ext = file_data.filename.split('.')[-1].lower()
        if ext not in ['jpg', 'jpeg', 'png', 'webp']:
            return web.json_response({"status": "error", "message": "Invalid file type"}, status=400)

        filename = f"prompt_{prompt_index}.{ext}"
        filepath = PREVIEW_DIR / filename

        # Save file
        with open(filepath, 'wb') as f:
            f.write(content)

        logger.info(f"Saved preview image: {filename}")
        return web.json_response({"status": "success", "filename": filename})
    except Exception as e:
        logger.error(f"Error uploading image: {e}")
        return web.json_response({"status": "error", "message": str(e)}, status=500)

@PromptServer.instance.routes.get("/prompt_manager/image/{filename}")
async def get_image(request):
    """Serve preview image."""
    try:
        filename = request.match_info['filename']
        filepath = PREVIEW_DIR / filename

        if not filepath.exists():
            return web.Response(status=404)

        with open(filepath, 'rb') as f:
            content = f.read()

        # Determine content type
        ext = filename.split('.')[-1].lower()
        content_types = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'webp': 'image/webp'
        }
        content_type = content_types.get(ext, 'image/jpeg')

        return web.Response(body=content, content_type=content_type)
    except Exception as e:
        logger.error(f"Error serving image: {e}")
        return web.Response(status=500)

@PromptServer.instance.routes.delete("/prompt_manager/image/delete")
async def delete_image(request):
    """Delete preview image."""
    try:
        data = await request.json()
        filename = data.get("filename", "").strip()

        if not filename:
            return web.json_response({"status": "error", "message": "Filename required"}, status=400)

        filepath = PREVIEW_DIR / filename
        if filepath.exists():
            filepath.unlink()
            logger.info(f"Deleted image: {filename}")

        return web.json_response({"status": "success"})
    except Exception as e:
        logger.error(f"Error deleting image: {e}")
        return web.json_response({"status": "error", "message": str(e)}, status=500)

@PromptServer.instance.routes.post("/prompt_manager/add")
async def add_prompt(request):
    """Add a new prompt."""
    try:
        data = await request.json()
        title = data.get("title", "").strip()
        cats = data.get("categories", [])
        fav = bool(data.get("favorite", False))
        image = data.get("image", None)
        prompt = data.get("prompt", "").strip()

        if not title or not prompt:
            return web.json_response({
                "status": "error",
                "message": "Title and prompt required"
            }, status=400)

        prompts = load_all_prompts()
        prompts.append({
            "index": len(prompts) + 1,
            "title": title,
            "categories": cats,
            "favorite": fav,
            "image": image,
            "prompt": prompt
        })
        save_all_prompts(prompts)

        # Update category list with any new categories
        existing_cats = load_categories()
        new_cats = [c for c in cats if c and c not in existing_cats]
        if new_cats:
            existing_cats.extend(new_cats)
            save_categories(existing_cats)

        logger.info(f"Added prompt: {title}")
        return web.json_response({"status": "success", "index": len(prompts)})
    except Exception as e:
        logger.error(f"Error adding prompt: {e}")
        return web.json_response({"status": "error", "message": str(e)}, status=500)

@PromptServer.instance.routes.post("/prompt_manager/update")
async def update_prompt(request):
    """Update existing prompt by index."""
    try:
        data = await request.json()
        idx = int(data.get("index", -1))
        title = data.get("title", "").strip()
        cats = data.get("categories", [])
        fav = bool(data.get("favorite", False))
        image = data.get("image", None)
        prompt_text = data.get("prompt", "").strip()

        prompts = load_all_prompts()

        if idx < 1 or idx > len(prompts):
            return web.json_response({
                "status": "error",
                "message": "Index out of range"
            }, status=400)

        prompts[idx - 1].update({
            "title": title,
            "categories": cats,
            "favorite": fav,
            "image": image,
            "prompt": prompt_text
        })

        save_all_prompts(prompts)

        # Update category list
        existing_cats = load_categories()
        new_cats = [c for c in cats if c and c not in existing_cats]
        if new_cats:
            existing_cats.extend(new_cats)
            save_categories(existing_cats)

        logger.info(f"Updated prompt {idx}: {title}")
        return web.json_response({"status": "success"})
    except Exception as e:
        logger.error(f"Error updating prompt: {e}")
        return web.json_response({"status": "error", "message": str(e)}, status=500)

@PromptServer.instance.routes.delete("/prompt_manager/delete")
async def delete_prompt(request):
    """Delete prompt by index."""
    try:
        data = await request.json()
        idx = int(data.get("index", -1))

        prompts = load_all_prompts()

        if idx < 1 or idx > len(prompts):
            return web.json_response({
                "status": "error",
                "message": "Index out of range"
            }, status=400)

        deleted = prompts.pop(idx - 1)

        # Delete associated image if exists
        if deleted.get("image"):
            filepath = PREVIEW_DIR / deleted["image"]
            if filepath.exists():
                filepath.unlink()

        save_all_prompts(prompts)

        logger.info(f"Deleted prompt: {deleted['title']}")
        return web.json_response({"status": "success", "deleted": deleted["title"]})
    except Exception as e:
        logger.error(f"Error deleting prompt: {e}")
        return web.json_response({"status": "error", "message": str(e)}, status=500)

@PromptServer.instance.routes.post("/prompt_manager/save")
async def save_prompts_endpoint(request):
    """Save entire prompt list."""
    try:
        data = await request.json()
        prompts = data.get("prompts", [])
        save_all_prompts(prompts)
        return web.json_response({"status": "success", "count": len(prompts)})
    except Exception as e:
        logger.error(f"Error saving prompts: {e}")
        return web.json_response({"status": "error", "message": str(e)}, status=500)


# Register node
NODE_CLASS_MAPPINGS = {"AKASH_PROMPT_MANAGER": PromptManagerNode}
NODE_DISPLAY_NAME_MAPPINGS = {"AKASH_PROMPT_MANAGER": "Prompt Manager"}
