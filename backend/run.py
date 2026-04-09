from app import create_app, socketio
import os

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("APP_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "1") == "1"
    print(f"🚀 RL Platform Backend starting on http://localhost:{port}")
    print(f"   Debug: {debug}")
    print(f"   DB: SQLite (instance/rl_platform.db)")
    socketio.run(app, host="0.0.0.0", port=port, debug=debug, allow_unsafe_werkzeug=True)
