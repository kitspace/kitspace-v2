#!/usr/bin/env python3
from __future__ import print_function
import json
import os
import sys
import subprocess
import urllib.request
import urllib.parse

GITHUB_TOKEN = sys.argv[1]


def get_pulls():
    url = f"https://api.github.com/repos/{os.environ['GITHUB_REPOSITORY']}/pulls"
    request = urllib.request.Request(url, method="GET")
    request.add_header("Accept", "application/vnd.github.v3+json")
    request.add_header("Authorization", f"token {GITHUB_TOKEN}")
    data = urllib.request.urlopen(request).read()
    return json.loads(data)


def post_comment(issue_number, message):
    url = f"https://api.github.com/repos/{os.environ['GITHUB_REPOSITORY']}/issues/{issue_number}/comments"
    request = urllib.request.Request(url, method="POST")
    request.add_header("Accept", "application/vnd.github.v3+json")
    request.add_header("Authorization", f"token {GITHUB_TOKEN}")
    request.add_header("Content-Type", "application/json")
    data = urllib.request.urlopen(request, json.dumps({"body": message})).read()
    return json.loads(data)


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

pulls = get_pulls()

for pull in pulls:
    if not pull["draft"]:
        try:
            subprocess.run(
                ["git", "pull", pull["head"]["repo"]["clone_url"], pull["head"]["ref"]],
                check=True,
            )
        except:
            post_comment(
                pull["number"],
                f"Could not merge '{pull['head']['label']}' into 'review' branch.",
            )
        else:
            post_comment(
                pull["number"],
                (
                    f"Merged '{pull['head']['label']}' into 'review' branch. After build it"
                    "will be deployed to [review.staging.kitspace.dev](https://review.staging.kitspace.dev)."
                ),
            )
