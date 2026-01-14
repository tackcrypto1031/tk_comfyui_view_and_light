"""
TK View and Light Node
Merged from ComfyUI-qwenmultiangle and ComfyUI-AdvancedCameraPrompts
"""

import numpy as np
from PIL import Image
import base64
import io
import hashlib

# Module-level cache
_cache = {}
_max_cache_size = 50

class TK_View_And_Light_Node:
    """
    TK View and Light Node
    Combines 3D camera visualization with advanced prompt generation and lighting control.
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                # Camera Inputs
                "horizontal_angle": ("INT", {
                    "default": 0,
                    "min": 0, "max": 360, "step": 1,
                    "display": "slider" 
                }),
                "vertical_angle": ("INT", {
                    "default": 0,
                    "min": -90, "max": 90, "step": 1, 
                    "display": "slider"
                }),
                "zoom": ("FLOAT", {
                    "default": 5.0,
                    "min": 0.0, "max": 10.0, "step": 0.1,
                    "display": "slider"
                }),
                
                # Light Enable Toggle
                "enable_light": ("BOOLEAN", {
                    "default": False,
                    "label": "Enable Lighting"
                }),
                
                # Lighting Inputs
                "light_horizontal": ("INT", {
                    "default": 45,
                    "min": 0, "max": 360, "step": 1,
                    "display": "slider"
                }),
                "light_vertical": ("INT", {
                    "default": 45,
                    "min": -90, "max": 90, "step": 1,
                    "display": "slider"
                }),
                "light_color": ("STRING", {
                    "default": "#FFFFFF",
                }),
            },
            "optional": {
                "image": ("IMAGE",),
            },
            "hidden": {
                "unique_id": "UNIQUE_ID",
            }
        }

    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("camera_prompt", "light_prompt")
    FUNCTION = "generate"
    CATEGORY = "TK Nodes"
    OUTPUT_NODE = True

    def _get_camera_prompt(self, h_angle, v_angle, zoom_val):
        h_angle = h_angle % 360
        
        # Horizontal (Azimuth) - 8 directions matching original qwenmultiangle
        if h_angle < 22.5 or h_angle >= 337.5:
            h_direction = "front view"
        elif h_angle < 67.5:
            h_direction = "front-right quarter view"
        elif h_angle < 112.5:
            h_direction = "right side view"
        elif h_angle < 157.5:
            h_direction = "back-right quarter view"
        elif h_angle < 202.5:
            h_direction = "back view"
        elif h_angle < 247.5:
            h_direction = "back-left quarter view"
        elif h_angle < 292.5:
            h_direction = "left side view"
        else:
            h_direction = "front-left quarter view"

        # Vertical (Elevation) - 4 levels matching original qwenmultiangle
        if v_angle < -15:
            v_direction = "low-angle shot"
        elif v_angle < 15:
            v_direction = "eye-level shot"
        elif v_angle < 45:
            v_direction = "elevated shot"
        else:
            v_direction = "high-angle shot"

        # Distance - 3 levels matching original qwenmultiangle
        if zoom_val < 2:
            distance = "wide shot"
        elif zoom_val < 6:
            distance = "medium shot"
        else:
            distance = "close-up"

        # Format: {view}, {angle}, {distance} (horizontal: X, vertical: Y, zoom: Z)
        return f"{h_direction}, {v_direction}, {distance} (horizontal: {h_angle}, vertical: {v_angle}, zoom: {zoom_val})"

    def _get_lighting_prompt(self, h_angle, v_angle, color_hex):
        h_angle = h_angle % 360
        
        # Horizontal Direction using standard naming
        if h_angle < 22.5 or h_angle >= 337.5: h_desc = "Front"
        elif h_angle < 67.5: h_desc = "Right Front"
        elif h_angle < 112.5: h_desc = "Right"
        elif h_angle < 157.5: h_desc = "Right Rear"
        elif h_angle < 202.5: h_desc = "Rear"
        elif h_angle < 247.5: h_desc = "Left Rear"
        elif h_angle < 292.5: h_desc = "Left"
        else: h_desc = "Left Front"
        
        # Vertical Height descriptor
        if v_angle > 30:
            v_desc = "Above"
        elif v_angle > 10:
            v_desc = "High"
        elif v_angle < -30:
            v_desc = "Below"
        elif v_angle < -10:
            v_desc = "Low"
        else:
            v_desc = "Level"
        
        # Always combine direction and height: e.g. "Rear, Above"
        direction = f"{h_desc}, {v_desc}"
        
        # Use the standard format: (light source from the [direction])
        return f"(light source from the {direction}), {color_hex} colored light"

    def generate(self, horizontal_angle, vertical_angle, zoom, enable_light, light_horizontal, light_vertical, light_color, image=None, unique_id=None):
        # Camera Prompt
        cam_prompt = self._get_camera_prompt(horizontal_angle, vertical_angle, zoom)
        
        # Handle Image for UI
        image_base64 = ""
        if image is not None:
            try:
                if hasattr(image, 'cpu'): img_np = image[0].cpu().numpy() if len(image.shape) == 4 else image.cpu().numpy()
                elif hasattr(image, 'numpy'): img_np = image.numpy()
                else: img_np = image
                
                img_np = (np.clip(img_np, 0, 1) * 255).astype(np.uint8)
                if img_np.ndim == 3:
                     if img_np.shape[-1] == 1: img_np = np.concatenate([img_np]*3, axis=-1)
                     elif img_np.shape[-1] == 4: img_np = img_np[..., :3]
                
                pil = Image.fromarray(img_np)
                buff = io.BytesIO()
                pil.save(buff, format="JPEG", quality=80) 
                image_base64 = "data:image/jpeg;base64," + base64.b64encode(buff.getvalue()).decode("utf-8")
            except: pass

        # Return separate camera and light prompts
        light_prompt = ""
        if enable_light:
            light_prompt = self._get_lighting_prompt(light_horizontal, light_vertical, light_color)

        return {
            "ui": {"image_base64": [image_base64]},
            "result": (cam_prompt, light_prompt)
        }

    @classmethod
    def IS_CHANGED(cls, **kwargs):
        return float("nan")

NODE_CLASS_MAPPINGS = {
    "TK_View_And_Light": TK_View_And_Light_Node
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "TK_View_And_Light": "TK View & Light"
}
