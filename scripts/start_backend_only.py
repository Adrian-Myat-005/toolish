# scripts/start_backend_only.py
import os
from pathlib import Path
import signal
import subprocess
import sys
import time

from dotenv import load_dotenv

project_root = Path(__file__).parent.parent
load_dotenv(project_root / ".env", override=False)

os.environ["PYTHONUNBUFFERED"] = "1"
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)


def print_flush(*args, **kwargs):
    kwargs.setdefault("flush", True)
    print(*args, **kwargs)


def terminate_process_tree(process, name="Process", timeout=5):
    if process is None or process.poll() is not None:
        return

    pid = process.pid
    print_flush(f"🛑 Stopping {name} (PID: {pid})...")

    try:
        if os.name == "nt":
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(pid)],
                check=False,
                capture_output=True,
                text=True,
            )
            try:
                process.wait(timeout=timeout)
                print_flush(f"   ✅ {name} terminated successfully")
            except subprocess.TimeoutExpired:
                print_flush(f"   ⚠️ {name} did not terminate within {timeout}s")
                try:
                    process.kill()
                    process.wait(timeout=2)
                except Exception:
                    pass
        else:
            pgid = os.getpgid(pid)
            try:
                os.killpg(pgid, signal.SIGTERM)
                print_flush(f"   Sent SIGTERM to process group {pgid}")
            except ProcessLookupError:
                print_flush(f"   Process group {pgid} already terminated")
                return
            except PermissionError:
                print_flush("   Cannot kill process group, trying single process")
                process.terminate()

            try:
                process.wait(timeout=timeout)
                print_flush(f"   ✅ {name} terminated gracefully")
                return
            except subprocess.TimeoutExpired:
                print_flush(f"   ⚠️ {name} did not terminate in {timeout}s, sending SIGKILL...")

            try:
                os.killpg(pgid, signal.SIGKILL)
                process.wait(timeout=2)
                print_flush(f"   ✅ {name} force killed")
            except ProcessLookupError:
                print_flush("   Process group already terminated")
            except Exception as e:
                print_flush(f"   ⚠️ Error during force kill: {e}")
                try:
                    process.kill()
                    process.wait(timeout=2)
                except Exception:
                    pass

    except Exception as e:
        print_flush(f"   ⚠️ Error stopping {name}: {e}")


def start_backend():
    print_flush(f"🚀 Starting FastAPI Backend using {sys.executable}...")
    project_root = Path(__file__).parent.parent
    
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))

    from src.services.setup import get_backend_port, init_user_directories
    init_user_directories(project_root) # Initialize user data directories

    backend_port = get_backend_port()
    print_flush(f"✅ Backend port: {backend_port}")

    cmd = [
        sys.executable,
        "-m", "uvicorn",
        "src.api.main:app",
        f"--port={backend_port}",
        "--host=0.0.0.0",
        "--reload"
    ]

    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    env["PYTHONUTF8"] = "1"
    env["PYTHONUNBUFFERED"] = "1"

    popen_kwargs = {
        "cwd": project_root,
        "stdout": subprocess.PIPE,
        "stderr": subprocess.STDOUT,
        "text": True,
        "bufsize": 1,
        "shell": False,
        "encoding": "utf-8",
        "errors": "replace",
        "env": env,
    }

    if os.name != "nt":
        popen_kwargs["start_new_session"] = True
    else:
        popen_kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP

    process = subprocess.Popen(cmd, **popen_kwargs)

    import threading
    def log_output():
        try:
            for line in iter(process.stdout.readline, ""):
                if line:
                    print_flush(f"[Backend]  {line.rstrip()}")
        except Exception as e:
            print_flush(f"[Backend]  Log output error: {e}")

    log_thread = threading.Thread(target=log_output, daemon=True)
    log_thread.start()

    print_flush(f"✅ Backend process started (PID: {process.pid})")
    return process


if __name__ == "__main__":
    backend = None

    try:
        backend = start_backend()

        from src.services.setup import get_backend_port
        backend_port = get_backend_port()

        print_flush("⏳ Waiting for backend to start...")
        for i in range(10):
            time.sleep(1)
            if backend.poll() is not None:
                print_flush(f"❌ Backend process exited with code {backend.returncode}")
                if backend.stdout:
                    output = backend.stdout.read()
                    if output:
                        print_flush(f"Backend output:\n{output}")
                break

            import socket
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                result = sock.connect_ex(("localhost", backend_port))
                sock.close()
                if result == 0:
                    print_flush(f"✅ Backend is running on port {backend_port}!")
                    break
            except:
                pass

        if backend.poll() is not None:
            print_flush("❌ Backend failed to start. Please check the error messages above.")
            sys.exit(1)

        print_flush("")
        print_flush("=" * 50)
        print_flush("✅ Backend is running!")
        print_flush("=" * 50)
        print_flush(f"   - Backend:  http://localhost:{backend_port}")
        print_flush("=" * 50)
        print_flush("")
        print_flush("Press Ctrl+C to stop the backend.")

        while True:
            if backend.poll() is not None:
                print_flush(
                    f"\n❌ Backend process exited unexpectedly (code: {backend.returncode})"
                )
                break
            time.sleep(0.5)

    except KeyboardInterrupt:
        print_flush("\n🛑 Stopping backend...")
    except Exception as e:
        print_flush(f"\n❌ Error: {e}")
    finally:
        terminate_process_tree(backend, name="Backend", timeout=5)

        print_flush("✅ Backend stopped.")
