#!/usr/bin/env python3
import subprocess
import github_api

subprocess.run(
    ["git", "config", "pull.rebase", "false"],
    check=True,
)
subprocess.run(
    ["git", "config", "user.email", "auto-merge-bot@kitspace.dev"],
    check=True,
)
subprocess.run(
    ["git", "config", "user.name", "Kitspace Auto-Merge Bot"],
    check=True,
)

pulls = github_api.get_pulls()

for pull in pulls:
    if not pull["draft"] and pull["head"] is not None:
        ref = pull["head"]["ref"]
        sha = pull["head"]["sha"]
        try:
            subprocess.run(
                ["git", "pull", pull["head"]["repo"]["clone_url"], ref], check=True
            )
        except:
            github_api.create_commit_status(
                sha,
                "failure",
                'Could not be merged into the "review" branch',
            )
        else:
            print(f'Merged "{pull["head"]["label"]}"')
            github_api.create_commit_status(
                sha, "pending", 'Successfully merged into the "review" branch'
            )
