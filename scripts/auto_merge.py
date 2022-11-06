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

# reversed so we merge oldest first
for pull in reversed(pulls):
    is_allowed = (
        pull["author_association"] == "MEMBER"
        or pull["author_association"] == "CONTRIBUTOR"
    )
    base = pull["base"]["ref"]
    if is_allowed and not pull["draft"] and pull["head"] is not None and base == "master":
        ref = pull["head"]["ref"]
        sha = pull["head"]["sha"]
        try:
            subprocess.run(
                ["git", "pull", pull["head"]["repo"]["clone_url"], ref, "--no-ff"],
                check=True,
            )
        except Exception as e:
            print(f'Error with merging "{pull["head"]["label"]}"')
            print(e)
            github_api.create_commit_status(
                sha,
                "failure",
                'Could not be merged into the "review" branch',
            )
            subprocess.run(["git", "merge", "--abort"], check=True)
        else:
            print(f'Merged "{pull["head"]["label"]}"')
            github_api.create_commit_status(
                sha, "pending", 'Successfully merged into the "review" branch'
            )
