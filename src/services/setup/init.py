# src/services/setup/init.py
import os
import json
from pathlib import Path

# Placeholder for a simple logger, since full logging might be too complex to recreate now
class SimpleLogger:
    def info(self, message):
        print(f"[INFO] {message}")
    def warning(self, message):
        print(f"[WARNING] {message}")
    def success(self, message):
        print(f"[SUCCESS] {message}")

_setup_logger = SimpleLogger()

def _get_setup_logger():
    global _setup_logger
    return _setup_logger

# ============================================================================ 
# User Directory Initialization
# ============================================================================ 

def init_user_directories(project_root: Path | None = None) -> None:
    if project_root is None:
        project_root = Path(__file__).parent.parent.parent.parent # /toolish

    user_data_dir = project_root / "data" / "user" # Simple default for now

    required_dirs = [
        "logs",  # User logs
        "run_code_workspace",  # Code execution workspace
    ]

    user_dir_exists = user_data_dir.exists()
    user_dir_empty = False
    if user_dir_exists:
        try:
            user_dir_empty = not any(user_data_dir.iterdir())
        except Exception as e:
            _get_setup_logger().warning(f"Cannot check if user directory is empty: {e}")
            user_dir_empty = False

    if not user_dir_exists or user_dir_empty:
        logger = _get_setup_logger()
        logger.info("\n" + "=" * 80)
        logger.info("INITIALIZING USER DATA DIRECTORY")
        logger.info("=" * 80)

        if not user_dir_exists:
            logger.info(f"Creating user data directory: {user_data_dir}")
        else:
            logger.info(f"User data directory is empty, initializing: {user_data_dir}")

        user_data_dir.mkdir(parents=True, exist_ok=True)

        for dir_name in required_dirs:
            dir_path = user_data_dir / dir_name
            dir_path.mkdir(parents=True, exist_ok=True)
            logger.success(f"Created: {dir_name}/")

        user_history_file = user_data_dir / "user_history.json"
        if not user_history_file.exists():
            initial_history = {"version": "1.0", "created_at": None, "sessions": []}
            try:
                with open(user_history_file, "w", encoding="utf-8") as f:
                    json.dump(initial_history, f, indent=2, ensure_ascii=False)
                logger.success("Created: user_history.json")
            except Exception as e:
                logger.warning(f"Failed to create user_history.json: {e}")

        settings_file = user_data_dir / "settings.json"
        if not settings_file.exists():
            initial_settings = {"theme": "light", "language": "en", "output_language": "en"}
            try:
                with open(settings_file, "w", encoding="utf-8") as f:
                    json.dump(initial_settings, f, indent=2, ensure_ascii=False)
                logger.success("Created: settings.json")
            except Exception as e:
                logger.warning(f"Failed to create settings.json: {e}")

        logger.info("=" * 80)
        logger.success("User data directory initialization complete!")
        logger.info("=" * 80 + "\n")
    else:
        for dir_name in required_dirs:
            dir_path = user_data_dir / dir_name
            dir_path.mkdir(parents=True, exist_ok=True)

        user_history_file = user_data_dir / "user_history.json"
        if not user_history_file.exists():
            initial_history = {"version": "1.0", "created_at": None, "sessions": []}
            try:
                with open(user_history_file, "w", encoding="utf-8") as f:
                    json.dump(initial_history, f, indent=2, ensure_ascii=False)
            except Exception:
                pass

        settings_file = user_data_dir / "settings.json"
        if not settings_file.exists():
            initial_settings = {"theme": "light", "language": "en", "output_language": "en"}
            try:
                with open(settings_file, "w", encoding="utf-8") as f:
                    json.dump(initial_settings, f, indent=2, ensure_ascii=False)
            except Exception:
                pass


# ============================================================================ 
# Port Configuration Management
# ============================================================================ 

def get_backend_port(project_root: Path | None = None) -> int:
    env_port = os.environ.get("BACKEND_PORT", "8002")
    try:
        return int(env_port)
    except ValueError:
        _get_setup_logger().warning(f"Invalid BACKEND_PORT: {env_port}, using default 8002")
        return 8002

def get_frontend_port(project_root: Path | None = None) -> int:
    env_port = os.environ.get("FRONTEND_PORT", "3782")
    try:
        return int(env_port)
    except ValueError:
        _get_setup_logger().warning(f"Invalid FRONTEND_PORT: {env_port}, using default 3782")
        return 3782

def get_ports(project_root: Path | None = None) -> tuple[int, int]:
    backend_port = get_backend_port(project_root)
    frontend_port = get_frontend_port(project_root)
    return (backend_port, frontend_port)
