#!/usr/bin/env python3
import subprocess
import threading
import time
import sys
import re
from datetime import datetime

# ANSI Colors
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"
BOLD = "\033[1m"

def get_service_status():
    """Checks if essensys-passive.service is active."""
    try:
        ret = subprocess.call(["systemctl", "is-active", "--quiet", "essensys-passive.service"])
        return ret == 0
    except FileNotFoundError:
        return False

def tail_logs():
    """Tails the systemd journal for the backend service."""
    try:
        # tail -f equivalent for systemd journal
        process = subprocess.Popen(
            ["journalctl", "-u", "essensys-passive.service", "-f", "-n", "20", "--no-pager"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1
        )

        for line in process.stdout:
            line = line.strip()
            if not line: continue
            
            # Simple formatting based on content
            timestamp = datetime.now().strftime("%H:%M:%S")
            
            if "BasicAuth: Success" in line:
                print(f"[{timestamp}] {GREEN}{line}{RESET}")
            elif "BasicAuth" in line and "failed" in line:
                 print(f"[{timestamp}] {YELLOW}{line}{RESET}")
            elif "/api/serverinfos" in line:
                print(f"[{timestamp}] {CYAN}{line}{RESET}")
            else:
                print(f"[{timestamp}] {line}")

    except KeyboardInterrupt:
        return
    except Exception as e:
        print(f"{RED}Error tailing logs: {e}{RESET}")

def monitor_status():
    """Periodically prints service status header."""
    while True:
        active = get_service_status()
        status_color = GREEN if active else RED
        status_text = "ACTIVE" if active else "INACTIVE"
        
        # Clear screen/move cursor? No, just print header periodically or once
        # For a simple 'tail' style, we just print the status at start
        # If we wanted a TUI we'd use curses, but user asked for "console.py tail -f" style
        # somewhat inspired by monitor.py but maybe simpler.
        # Let's verify if they want a TUI or just a colored tail.
        # "console.py qui permet de faire un tail -f ... et dire si les services sont demarer"
        # I will do a simple header + tail.
        pass
        time.sleep(10)

def main():
    print(f"{BOLD}=== Essensys Passive Monitor ==={RESET}")
    
    active = get_service_status()
    if active:
        print(f"Service Status: {GREEN}ACTIVE{RESET}")
    else:
        print(f"Service Status: {RED}INACTIVE{RESET}")
        print(f"{YELLOW}Tip: sudo systemctl start essensys-passive.service{RESET}")

    print(f"{CYAN}Tailing logs for /api/serverinfos... (Ctrl+C to stop){RESET}")
    print("-" * 50)
    
    try:
        tail_logs()
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Stopping monitor.{RESET}")

if __name__ == "__main__":
    main()
