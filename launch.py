"""Software Trace Hub — Launch Pad"""
import subprocess
import sys
import os
import time
import webbrowser

BANNER = r"""
  ╔═══════════════════════════════════════════════════╗
  ║         SOFTWARE TRACE HUB                        ║
  ║         RTM · IEC 62304 · ISO 14971               ║
  ╚═══════════════════════════════════════════════════╝
"""

ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.join(ROOT, "backend")
FRONTEND = os.path.join(ROOT, "frontend")

# Auto-activate venv if not already in one
def _find_venv_python():
    for name in ("venv", ".venv"):
        vdir = os.path.join(ROOT, name)
        if sys.platform == "win32":
            py = os.path.join(vdir, "Scripts", "python.exe")
        else:
            py = os.path.join(vdir, "bin", "python")
        if os.path.isfile(py):
            return py
    return None

if sys.prefix == sys.base_prefix:  # not in a venv
    _venv_py = _find_venv_python()
    if _venv_py:
        sys.exit(subprocess.call([_venv_py] + sys.argv))


def menu():
    print(BANNER)
    print("  [1]  Start Backend          (FastAPI :5001)")
    print("  [2]  Start Frontend         (Vite :3001)")
    print("  [3]  Start Both")
    print("  [4]  Build Frontend         (production dist)")
    print("  [5]  Install Dependencies")
    print("  [0]  Exit")
    print()


def start_backend():
    print("\n  Starting backend on http://localhost:5001 ...")
    env = os.environ.copy()
    env["PYTHONPATH"] = BACKEND
    kwargs = {}
    if sys.platform == "win32":
        kwargs["creationflags"] = subprocess.CREATE_NEW_CONSOLE
    return subprocess.Popen(
        [sys.executable, "app.py"],
        cwd=BACKEND,
        env=env,
        **kwargs,
    )


def start_frontend():
    print("\n  Starting frontend on http://localhost:3001 ...")
    npm = "npm.cmd" if sys.platform == "win32" else "npm"
    kwargs = {}
    if sys.platform == "win32":
        kwargs["creationflags"] = subprocess.CREATE_NEW_CONSOLE
    return subprocess.Popen(
        [npm, "run", "dev"],
        cwd=FRONTEND,
        **kwargs,
    )


def build_frontend():
    print("\n  Building frontend for production ...")
    npm = "npm.cmd" if sys.platform == "win32" else "npm"
    subprocess.run([npm, "run", "build"], cwd=FRONTEND)
    print("  Done. Output in frontend/dist/")


def install_deps():
    print("\n  Installing Python dependencies ...")
    subprocess.run(
        [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
        cwd=BACKEND,
    )
    print("\n  Installing Node dependencies ...")
    npm = "npm.cmd" if sys.platform == "win32" else "npm"
    subprocess.run([npm, "install"], cwd=FRONTEND)
    print("  Done.")


def main():
    procs = []
    try:
        while True:
            menu()
            choice = input("  > ").strip()

            if choice == "1":
                procs.append(start_backend())
                time.sleep(1)
                webbrowser.open("http://localhost:5001")
                print("  Backend running. Press Enter to return to menu.")
                input()

            elif choice == "2":
                procs.append(start_frontend())
                time.sleep(2)
                webbrowser.open("http://localhost:3001")
                print("  Frontend running. Press Enter to return to menu.")
                input()

            elif choice == "3":
                procs.append(start_backend())
                time.sleep(1)
                procs.append(start_frontend())
                time.sleep(2)
                webbrowser.open("http://localhost:3001")
                print("\n  Both running:")
                print("    Backend  → http://localhost:5001")
                print("    Frontend → http://localhost:3001")
                print("\n  Press Enter to return to menu.")
                input()

            elif choice == "4":
                build_frontend()
                input("\n  Press Enter to continue.")

            elif choice == "5":
                install_deps()
                input("\n  Press Enter to continue.")

            elif choice == "0":
                break

            else:
                print("  Invalid choice.")
                time.sleep(0.5)

    except KeyboardInterrupt:
        pass
    finally:
        print("\n  Shutting down ...")
        for p in procs:
            try:
                p.terminate()
            except Exception:
                pass
        print("  Goodbye.")


if __name__ == "__main__":
    main()
