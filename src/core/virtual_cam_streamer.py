"""
MirrorView Virtual Camera Streaming Daemon.
Continuously broadcasts frames to the Windows DirectShow Virtual Camera device using pyvirtualcam at 30 FPS.
Receives real-time processed frames from the MirrorView canvas pipeline over WebSocket (port 5176).
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

WIDTH = 1280
HEIGHT = 720
FPS = 30
PORT = 5176

# Global state
# Initial background: Elegant obsidian dark frame with subtle center marker
current_frame = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
current_frame[:, :] = [15, 23, 42] # slate-900
# Center banner
current_frame[350:370, 480:800] = [6, 182, 212] # cyan accent

has_received_first_frame = False
frame_count = 0

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
                print(f"[VirtualCamStreamer] Broadcast healthy: {frame_count} frames piped (active: {has_received_first_frame})", flush=True)
        except Exception as e:
            print(f"[VirtualCamStreamer] Broadcast error: {e}", file=sys.stderr, flush=True)

        elapsed = time.perf_counter() - start_time
        sleep_time = interval - elapsed
        if sleep_time > 0:
            await asyncio.sleep(sleep_time)
        else:
            await asyncio.sleep(0.001)

async def stream_handler(websocket):
    global current_frame, has_received_first_frame
    print(f"[VirtualCamStreamer] MirrorView frontend connected from {websocket.remote_address}", flush=True)
    try:
        await websocket.send(json.dumps({"status": "connected", "device": "MirrorView Virtual Camera"}))
    except Exception:
        pass

    async for message in websocket:
        if isinstance(message, bytes):
            try:
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
                if cmd.get("action") == "ping":
                    await websocket.send(json.dumps({"action": "pong", "framesSent": frame_count}))
            except Exception:
                pass

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
