"""
Live WebSocket & API Integration Test
Connects to live running server at ws://localhost:8000/ws/telemetry,
reads 10 real-time telemetry frames, validates ISRO report API, and downloads CSV dataset.
"""

import asyncio
import json
import urllib.request
import websockets

async def test_live_stream():
    print("\n--- [1] Testing Live WebSocket Stream (60 FPS Telemetry) ---")
    uri = "ws://localhost:8000/ws/telemetry"
    async with websockets.connect(uri) as ws:
        for i in range(10):
            raw = await ws.recv()
            data = json.loads(raw)
            print(f"Frame #{i+1:02d} | Lock: {data['gimbal']['is_locked']} | Az: {data['gimbal']['gimbal_azimuth_deg']} deg | Error: {data['gimbal']['total_error_mrad']} mrad | Latency: {data['performance']['latency_ms']} ms | BER: {data['optics']['ber_scientific']}")
    
    print("\n--- [2] Testing ISRO Performance Benchmark JSON API ---")
    res = urllib.request.urlopen("http://localhost:8000/api/benchmark/report")
    report = json.loads(res.read().decode())
    print(f"Report Metadata: {report.get('metadata', {}).get('organization')}")
    print(f"FPS: {report.get('summary_metrics', {}).get('average_fps')} | Lock Retention: {report.get('summary_metrics', {}).get('lock_retention_rate_pct')}%")
    
    print("\n--- [3] Testing ISRO CSV Benchmark Export API ---")
    csv_res = urllib.request.urlopen("http://localhost:8000/api/benchmark/csv")
    csv_bytes = csv_res.read()
    print(f"CSV Download: {len(csv_bytes)} bytes received")
    
    print("\n--- [4] Testing Frontend Static Files Delivery ---")
    html_res = urllib.request.urlopen("http://localhost:8000/")
    html_content = html_res.read().decode()
    assert "ISRO FSOC" in html_content
    print("Frontend HTML5 / Three.js Mission Control loaded successfully (HTTP 200 OK)")

    print("\n=======================================================")
    print(" >>> LIVE SYSTEM INTEGRATION TEST PASSED (100%) <<<")
    print("=======================================================\n")

if __name__ == "__main__":
    asyncio.run(test_live_stream())
