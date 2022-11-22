#!/usr/bin/env python3
import sys
import subprocess
import github_api

# log all merges since master in a format of "%ae %P"
# which is "<merger-email> <parent1-sha> <parent2-sha>"
merges = (
    subprocess.check_output(
        ["git", "log", "origin/master..HEAD", "--merges", "--format=%ae %P", "--"],
    )
    .decode("utf-8")
    .splitlines()
)

state = sys.argv[2]

shas = []

for line in merges:
    line = line.split(" ")
    email = line[0]
    if email == "auto-merge-bot@kitspace.dev":
        # always take the second parent of the merge as the sha we are interested in
        sha = line[2]
        shas.append(sha)
        print(state, sha)
        if state == "failure":
            github_api.create_commit_status(
                sha,
                "failure",
                "Merged but could not be deployed",
            )
            deployment = github_api.get_deployment(sha)
            if deployment is None:
                deployment = github_api.create_deployment(sha)
            github_api.create_deployment_status(deployment["id"], "failure")
        elif state == "pending":
            github_api.create_commit_status(
                sha,
                "pending",
                "Requested deployment",
            )
            deployment = github_api.get_deployment(sha)
            if deployment is None:
                deployment = github_api.create_deployment(sha)
                github_api.create_deployment_status(deployment["id"], "pending")
            elif (
                github_api.get_last_deployment_status_state(deployment["id"])
                != "success"
            ):
                github_api.create_deployment_status(deployment["id"], "pending")


if state == "success":
    # mark any previous deployments as inactive and delete them
    deployments = github_api.get_deployments()
    for deployment in deployments:
        print("deleting", deployment["id"], deployment["ref"])
        github_api.create_deployment_status(deployment["id"], "inactive")
        github_api.delete_deployment(deployment["id"])
    for sha in shas:
        print("posting", sha, "success")
        github_api.create_commit_status(sha, "success", "Deployed")
        deployment = github_api.create_deployment(sha)
        github_api.create_deployment_status(deployment["id"], "success")
