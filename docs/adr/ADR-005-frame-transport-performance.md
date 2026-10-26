# ADR-005: Frame Transport and Performance Approach

## Status
Accepted

## Context
Video data at 720p (1280x720) at 30 FPS consists of ~3.68 million bytes per frame in RGBA format, generating roughly 110.6 MB/s of raw uncompressed video throughput.
NFR-001 requires 720p at 30 FPS, and NFR-002 mandates that processing latency remain low (under 100 ms).
The architecture must prevent unnecessary memory copies, avoid GC thrashing in JavaScript, and maintain smooth frame rates.

## Options Considered

### Option 1: WebSocket / Local TCP Socket Loopback
- **Pros**: Easy to implement in pure JavaScript/Node.js.
- **Cons**: High serialization/deserialization CPU load, network stack packetization, TCP windowing overhead, and excessive garbage collection pauses. Unacceptable for sustained 30+ FPS video streaming.

### Option 2: Shared Memory Circular Ring Buffer (`CreateFileMapping` / POSIX `shm_open`)
- **Pros**:
  - True zero-network, ultra-low latency (< 1ms per frame transfer).
  - Fixed-size pre-allocated shared memory buffer (header + double/triple buffered frame slots).
  - Header contains sequence number, timestamp, width, height, pixel format, and frame ready event/mutex.
  - Reader locks slot, reads frame without blocking writer.
  - Zero garbage collector pressure.
- **Cons**: Requires OS-specific shared memory APIs (Win32 file mapping on Windows, POSIX shared memory or direct `/dev/videoX` write on Linux).

## Decision
Adopt **Shared Memory Circular Ring Buffer** for virtual camera output. The capture and image-transform pipeline runs hardware-accelerated in WebGL/Canvas; frames are transferred via native shared memory buffer directly to the virtual camera device sink.
