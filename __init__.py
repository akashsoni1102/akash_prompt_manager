"""
AKASH_PROMPT_MANAGER v1.0.0
A powerful prompt management system for ComfyUI with Favorites, Categories & Image Previews.

Author: Akash Soni
GitHub: https://github.com/akashsoni1102/akash_prompt_manager
License: MIT
"""

__version__ = "1.0.0"

from .nodes import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

# Serve JavaScript from ./js
WEB_DIRECTORY = "./js"

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS', 'WEB_DIRECTORY', '__version__']
