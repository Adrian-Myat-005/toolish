# scripts/start_web.py
import os
from pathlib import Path
import shutil
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
    
    # Ensure project root is in Python path
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))

    from src.services.setup import get_backend_port, init_user_directories
    init_user_directories(project_root) # Initialize user data directories

    backend_port = get_backend_port()
    print_flush(f"✅ Backend port: {backend_port}")

    # Use uvicorn to run the FastAPI app
    cmd = [
        sys.executable,
        "-m", "uvicorn",
        "src.api.main:app",
        f"--port={backend_port}",
        "--host=0.0.0.0",
        "--reload" # Enable auto-reloading for development
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


def start_frontend():
    print_flush("🚀 Starting Next.js Frontend...")
    project_root = Path(__file__).parent.parent
    web_dir = project_root

    # Ensure project root is in Python path
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))

    from src.services.setup import get_frontend_port

    frontend_port = get_frontend_port()
    print_flush(f"✅ Frontend port: {frontend_port}")

    npm_path = shutil.which("npm")
    if not npm_path:
        print_flush("❌ Error: 'npm' command not found!")
        raise RuntimeError("npm is not installed or not in PATH")

    print_flush(f"✅ Found npm at: {npm_path}")

    # Ensure node_modules exists
    if not os.path.exists(project_root / "node_modules"):
        print_flush("📦 Installing frontend dependencies...")
        npm_cmd = shutil.which("npm") or "npm"
        subprocess.run([npm_cmd, "install"], cwd=web_dir, check=True)
        print_flush("✅ Frontend dependencies installed successfully")

    # Determine API base URL
    from src.services.setup import get_backend_port
    backend_port = get_backend_port()
    api_base_url = f"http://localhost:{backend_port}"

    # Update .env.local with NEXT_PUBLIC_API_BASE
    env_local_path = project_root / ".env.local"
    try:
        content = ""
        if env_local_path.exists():
            content = env_local_path.read_text()
        
        new_lines = []
        found = False
        for line in content.splitlines():
            if line.startswith("NEXT_PUBLIC_API_BASE="):
                new_lines.append(f"NEXT_PUBLIC_API_BASE={api_base_url}")
                found = True
            else:
                new_lines.append(line)
        
        if not found:
            if new_lines: new_lines.append("")
            new_lines.append(f"NEXT_PUBLIC_API_BASE={api_base_url}")
        
        env_local_path.write_text("\n".join(new_lines))
        print_flush(f"✅ Updated .env.local with API base: {api_base_url}")
    except Exception as e:
        print_flush(f"⚠️ Warning: Failed to update .env.local: {e}")

    env = os.environ.copy()
    env["PORT"] = str(frontend_port)
    env["NEXT_PUBLIC_API_BASE"] = api_base_url

    npm_cmd = shutil.which("npm") or "npm"
    frontend_process = subprocess.Popen(
        [npm_cmd, "run", "dev", "--", "-p", str(frontend_port)],
        cwd=web_dir,
        shell=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        env=env,
        encoding="utf-8",
        errors="replace",
    )

    import threading
    def log_frontend_output():
        try:
            for line in iter(frontend_process.stdout.readline, ""):
                if line:
                    print_flush(f"[Frontend] {line.rstrip()}")
        except Exception as e:
            print_flush(f"[Frontend] Log output error: {e}")

    log_thread = threading.Thread(target=log_frontend_output, daemon=True)
    log_thread.start()

    print_flush(f"✅ Frontend process started (PID: {frontend_process.pid})")
    return frontend_process


if __name__ == "__main__":
    backend = None
    frontend = None

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

        frontend = start_frontend()

        from src.services.setup import get_ports
        backend_port, frontend_port = get_ports()

        print_flush("")
        print_flush("=" * 50)
        print_flush("✅ Services are running!")
        print_flush("=" * 50)
        print_flush(f"   - Backend:  http://localhost:{backend_port}")
        print_flush(f"   - Frontend: http://localhost:{frontend_port}")
        print_flush("=" * 50)
        print_flush("")
        print_flush("Press Ctrl+C to stop all services.")

        while True:
            if backend.poll() is not None:
                print_flush(
                    f"\n❌ Backend process exited unexpectedly (code: {backend.returncode})"
                )
                break
            time.sleep(0.5)

    except KeyboardInterrupt:
        print_flush("\n🛑 Stopping services...")
    except Exception as e:
        print_flush(f"\n❌ Error: {e}")
    finally:
        terminate_process_tree(backend, name="Backend", timeout=5)
        terminate_process_tree(frontend, name="Frontend", timeout=5)

        print_flush("✅ All services stopped.")
