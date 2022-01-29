#!/usr/bin/env python3
import sys
import subprocess
import github_api

merge_parents = subprocess.check_output(
    ["git", "log", "origin/master..HEAD", "--merges", "--format=%P"],
).decode("utf-8")

state = sys.argv[1]

for parents in merge_parents.splitlines():
    parents = parents.split(" ")
    # always take the second parent of the merge as the sha we are interested in
    sha = parents[1]
    if state == "failure":
        github_api.create_commit_status(
            sha,
            "failure",
            "Merged but could not be deployed",
        )
    elif state == "success":
        github_api.create_commit_status(
            sha, "success", "Deployed", target_url="https://review.staging.kitspace.dev"
        )
