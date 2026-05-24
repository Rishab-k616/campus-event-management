import importlib.util
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent / "campus-event-backend"
sys.path.insert(0, str(backend_dir))

spec = importlib.util.spec_from_file_location("campus_event_backend_server", backend_dir / "server.py")
if spec is None or spec.loader is None:
    raise RuntimeError("Cannot load campus-event-backend/server.py")

module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

app = module.app
