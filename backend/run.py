import uvicorn
if __name__ == "__main__":
    print("=================================================================")
    print("  ISRO AI-BASED VIRTUAL CAMERA TRACKING ENGINE (PS ID: 26169)")
    print("  Coarse Alignment System for Mobile FSOC Terminals")
    print("  Server running at: http://localhost:8000")
    print("  WebSocket Telemetry: ws://localhost:8000/ws/telemetry")
    print("  ISRO Benchmark Report: http://localhost:8000/api/benchmark/report")
    print("=================================================================")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
