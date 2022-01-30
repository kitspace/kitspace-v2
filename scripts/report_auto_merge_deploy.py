#!/usr/bin/env python3
import sys
import subprocess
import github_api

# log all merges since master in a format of "%ae %P"
# which is "<merger-email> <parent1-sha> <parent2-sha>"
merges = (
    subprocess.check_output(
        ["git", "log", "origin/master..HEAD", "--merges", "--format=%ae %P"],
    )
    .decode("utf-8")
    .splitlines()
)

state = sys.argv[1]

for line in merges:
    line = line.split(" ")
    email = line[0]
    if email == "auto-merge-bot@kitspace.dev":
        # always take the second parent of the merge as the sha we are interested in
        sha = line[2]
        if state == "failure":
            github_api.create_commit_status(
                sha,
                "failure",
                "Merged but could not be deployed",
            )
        elif state == "success":
            github_api.create_commit_status(
                sha,
                "success",
                "Deployed",
                target_url="https://review.staging.kitspace.dev",
            )
        elif state == "pending":
            github_api.create_commit_status(
                sha,
                "pending",
                "Building images",
            )
