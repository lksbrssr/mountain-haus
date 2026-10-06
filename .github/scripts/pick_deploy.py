#!/usr/bin/env python3
"""Print "<uid> <state>" for the production deployment matching a commit SHA.

Usage: pick_deploy.py <sha> <deployments.json>
Prints an empty line if no deployment for that commit is present yet.
"""
import json
import sys


def main() -> int:
    sha = sys.argv[1]
    with open(sys.argv[2]) as f:
        data = json.load(f)
    for d in data.get("deployments", []):
        if (d.get("meta") or {}).get("githubCommitSha") == sha:
            uid = d.get("uid") or ""
            state = d.get("readyState") or d.get("state") or ""
            print(f"{uid} {state}")
            return 0
    print("")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
