"""
MirrorView Virtual Camera Bridge Server.
Receives processed RGB/RGBA video frames from the MirrorView studio pipeline
and feeds them directly into the Windows DirectShow Virtual Camera device
(UnityCapture / DirectShow loopback) using pyvirtualcam.
"""

import sys
import time
import json
import asyncio
import numpy as np

try:
    import pyvirtualcam
except ImportError:
    print(json.dumps({"error": "pyvirtualcam not installed"}))
    sys.exit(1)

WIDTH = 1280
HEIGHT = 720
FPS = 30

def check_virtual_camera_ready():
    """Verify if a supported virtual camera device is registered on the OS."""
    try:
        with pyvirtualcam.Camera(width=WIDTH, height=HEIGHT, fps=FPS) as cam:
            return {"ready": True, "device": cam.device, "backend": cam.backend}
    except Exception as e:
        return {"ready": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--check":
        status = check_virtual_camera_ready()
        print(json.dumps(status))
        sys.exit(0 if status.get("ready") else 1)

    print(json.dumps(check_virtual_camera_ready()))
