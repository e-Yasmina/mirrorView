"""
MirrorView Virtual Camera Streaming Daemon.
Continuously broadcasts frames to the Windows DirectShow Virtual Camera device using pyvirtualcam at 30 FPS.
Receives real-time processed frames from the MirrorView canvas pipeline over WebSocket (port 5176).
Provides Option 2: High-speed native OpenCV C++ bilateral edge-preserving smoothing filter.
"""

import sys
import asyncio
import io
import json
import time
import numpy as np
from PIL import Image

try:
    import websockets
    import pyvirtualcam
except ImportError as e:
    print(f"Missing required dependencies: {e}", file=sys.stderr, flush=True)
    sys.exit(1)

try:
    import cv2
    OPENCV_AVAILABLE = True
    print(f"[VirtualCamStreamer] OpenCV C++ engine active (version {cv2.__version__})", flush=True)
except ImportError:
    OPENCV_AVAILABLE = False
    print("[VirtualCamStreamer] OpenCV not found, falling back to basic pipeline", file=sys.stderr, flush=True)

WIDTH = 1280
HEIGHT = 720
FPS = 30
PORT = 5176

# Global state
current_frame = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
current_frame[:, :] = [15, 23, 42] # slate-900
current_frame[350:370, 480:800] = [6, 182, 212] # cyan accent

has_received_first_frame = False
frame_count = 0

# Filter state received from MirrorView UI
filter_settings = {
    "beautyEngine": "mediapipe",
    "smoothness": 0
}

async def camera_broadcaster(cam):
    """Continuously broadcast current_frame to pyvirtualcam at steady 30 FPS."""
    global current_frame, frame_count
    interval = 1.0 / FPS
    print(f"[VirtualCamStreamer] Broadcaster loop active on {cam.device} ({cam.backend})", flush=True)

    while True:
        start_time = time.perf_counter()
        try:
            cam.send(current_frame)
            frame_count += 1
            if frame_count % 150 == 0:
                engine = filter_settings["beautyEngine"]
                smoothness = filter_settings["smoothness"]
                print(f"[VirtualCamStreamer] Broadcast healthy: {frame_count} frames | Filter: {engine} ({smoothness}%) | Active: {has_received_first_frame}", flush=True)
        except Exception as e:
            print(f"[VirtualCamStreamer] Broadcast error: {e}", file=sys.stderr, flush=True)

        elapsed = time.perf_counter() - start_time
        sleep_time = interval - elapsed
        if sleep_time > 0:
            await asyncio.sleep(sleep_time)
        else:
            await asyncio.sleep(0.001)

def apply_opencv_beauty_filter(bgr_img: np.ndarray, smoothness: int) -> np.ndarray:
    """
    Applies Option 2: High-speed OpenCV bilateral edge-preserving filter in native C++.
    Selectively diffuses low-contrast skin surface textures (blemishes, pores, sensor noise)
    while preserving high-contrast facial contours (eyes, pupils, eyebrows, eyelashes, lips).
    """
    if not OPENCV_AVAILABLE or smoothness <= 0:
        return bgr_img

    norm = smoothness / 100.0
    h, w = bgr_img.shape[:2]

    # Downscale to half resolution for ultra-low latency (<20ms) C++ bilateral filtering
    small = cv2.resize(bgr_img, (w // 2, h // 2), interpolation=cv2.INTER_LINEAR)

    d = 9
    sigma_color = int(norm * 65 + 15)
    sigma_space = int(norm * 45 + 15)

    smooth_small = cv2.bilateralFilter(small, d, sigma_color, sigma_space)
    smooth_full = cv2.resize(smooth_small, (w, h), interpolation=cv2.INTER_LINEAR)

    alpha = min(0.95, norm * 0.90)
    blended = cv2.addWeighted(smooth_full, alpha, bgr_img, 1.0 - alpha, 0)
    return blended

async def stream_handler(websocket):
    global current_frame, has_received_first_frame, filter_settings
    print(f"[VirtualCamStreamer] MirrorView frontend connected from {websocket.remote_address}", flush=True)
    try:
        await websocket.send(json.dumps({
            "status": "connected",
            "device": "MirrorView Virtual Camera",
            "openCvAvailable": OPENCV_AVAILABLE,
            "engine": filter_settings["beautyEngine"],
            "smoothness": filter_settings["smoothness"]
        }))
    except Exception:
        pass

    async for message in websocket:
        if isinstance(message, bytes):
            try:
                if OPENCV_AVAILABLE:
                    nparr = np.frombuffer(message, np.uint8)
                    bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    if bgr is not None:
                        if bgr.shape[0] != HEIGHT or bgr.shape[1] != WIDTH:
                            bgr = cv2.resize(bgr, (WIDTH, HEIGHT), interpolation=cv2.INTER_LINEAR)

                        # Apply Option 2: OpenCV C++ Hardware Filter if selected
                        if filter_settings["beautyEngine"] == "opencv" and filter_settings["smoothness"] > 0:
                            bgr = apply_opencv_beauty_filter(bgr, filter_settings["smoothness"])

                        current_frame = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
                        has_received_first_frame = True
                        continue
                
                # Fallback to PIL decode
                image = Image.open(io.BytesIO(message)).convert("RGB")
                if image.size != (WIDTH, HEIGHT):
                    image = image.resize((WIDTH, HEIGHT), Image.Resampling.BILINEAR)
                current_frame = np.array(image)
                has_received_first_frame = True
            except Exception as err:
                print(f"[VirtualCamStreamer] Frame decode error: {err}", file=sys.stderr, flush=True)
        elif isinstance(message, str):
            try:
                cmd = json.loads(message)
                action = cmd.get("action")
                if action == "set_filter":
                    filter_settings["beautyEngine"] = cmd.get("beautyEngine", filter_settings["beautyEngine"])
                    filter_settings["smoothness"] = int(cmd.get("smoothness", filter_settings["smoothness"]))
                    await websocket.send(json.dumps({
                        "action": "filter_updated",
                        "engine": filter_settings["beautyEngine"],
                        "smoothness": filter_settings["smoothness"]
                    }))
                elif action == "ping":
                    await websocket.send(json.dumps({
                        "action": "pong",
                        "framesSent": frame_count,
                        "openCvAvailable": OPENCV_AVAILABLE,
                        "engine": filter_settings["beautyEngine"],
                        "smoothness": filter_settings["smoothness"]
                    }))
            except Exception as e:
                print(f"[VirtualCamStreamer] Command error: {e}", file=sys.stderr, flush=True)

async def main():
    print(f"[VirtualCamStreamer] Initializing Virtual Camera device...", flush=True)
    try:
        with pyvirtualcam.Camera(width=WIDTH, height=HEIGHT, fps=FPS, fmt=pyvirtualcam.PixelFormat.RGB) as cam:
            print(f"[VirtualCamStreamer] Virtual Camera successfully initialized: {cam.device}", flush=True)

            # Start continuous 30 FPS broadcaster
            broadcast_task = asyncio.create_task(camera_broadcaster(cam))

            print(f"[VirtualCamStreamer] Starting WebSocket server on ws://127.0.0.1:{PORT}...", flush=True)
            async with websockets.serve(stream_handler, "127.0.0.1", PORT, max_size=10 * 1024 * 1024):
                print(f"[VirtualCamStreamer] Ready to pipe frames into virtual camera device on port {PORT}", flush=True)
                await asyncio.gather(broadcast_task)

    except Exception as exc:
        print(f"[VirtualCamStreamer] Failed to initialize virtual camera: {exc}", file=sys.stderr, flush=True)
        sys.exit(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("[VirtualCamStreamer] Shutting down.", flush=True)
