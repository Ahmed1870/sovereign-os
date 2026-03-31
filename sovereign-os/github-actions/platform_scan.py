"""
Sovereign OS - Platform Footprint Scanner (GitHub Actions)
Uses holehe for email-to-platform matching.
"""
import asyncio
import subprocess
import sys
import os

def run_holehe(email: str):
    """Run holehe CLI tool for email footprint scan."""
    try:
        result = subprocess.run(
            ["holehe", email, "--only-used", "--no-color"],
            capture_output=True, text=True, timeout=120
        )
        return result.stdout
    except FileNotFoundError:
        return "holehe not installed"
    except subprocess.TimeoutExpired:
        return "scan timed out"


async def main():
    print("🌐 Sovereign OS Platform Scanner")
    print("This script is for development/testing purposes.")
    print("In production, scans run per-user via the API.")


if __name__ == "__main__":
    asyncio.run(main())
