#!/usr/bin/env python3
from __future__ import print_function
import json
import os
import sys
import subprocess
import urllib.request
import urllib.parse

GITHUB_TOKEN = sys.argv[1]
GITHUB_REPOSITORY = os.environ["GITHUB_REPOSITORY"]
HEADERS = {
    "Accept": "application/vnd.github.v3+json",
    "Authorization": f"token {GITHUB_TOKEN}",
    "Content-Type": "application/json",
}


def get_pulls():
    url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/pulls"
    request = urllib.request.Request(url, method="GET", headers=HEADERS)
    response = urllib.request.urlopen(request).read()
    return json.loads(response)


def delete_bot_comments(issue_number):
    # XXX won't work if there are more than 100 comments
    url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/issues/{issue_number}/comments?per_page=100"
    request = urllib.request.Request(url, method="GET", headers=HEADERS)
    response = urllib.request.urlopen(request).read()
    comments = json.loads(response)
    print(f"{len(comments)} comments")
    for comment in comments:
        if comment["user"]["login"] == "github-actions[bot]":
            url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/issues/comments/{comment['id']}"
            request = urllib.request.Request(url, method="DELETE", headers=HEADERS)
            response = urllib.request.urlopen(request).read()


def post_comment(issue_number, message):
    delete_bot_comments(issue_number)
    url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/issues/{issue_number}/comments"
    data = json.dumps({"body": message}).encode("utf-8")
    request = urllib.request.Request(url, method="POST", headers=HEADERS, data=data)
    response = urllib.request.urlopen(request).read()
    return json.loads(response)


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
                f":x: Could not merge this into the 'review' branch.",
            )
        else:
            post_comment(
                pull["number"],
                (
                    f":heavy_check_mark: Merged this into the 'review' branch. After build it "
                    "will be deployed to [review.staging.kitspace.dev](https://review.staging.kitspace.dev)."
                ),
            )
