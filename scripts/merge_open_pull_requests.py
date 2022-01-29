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
GITHUB_RUN_ID = os.environ["GITHUB_RUN_ID"]
GITHUB_RUN_URL = "https://github.com/{GITHUB_REPOSITORY}/runs/{GITHUB_RUN_ID}"
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


def get_comments(issue_number, page=1):
    page_size = 30
    url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/issues/{issue_number}/comments?page={page}&per_page={page_size}"
    request = urllib.request.Request(url, method="GET", headers=HEADERS)
    response = urllib.request.urlopen(request).read()
    comments = json.loads(response)
    if len(comments) == page_size:
        comments += get_comments(issue_number, page=page + 1)
    return comments


def delete_bot_comments(issue_number):
    comments = get_comments(issue_number)
    for comment in comments:
        if comment["user"]["login"] == "github-actions[bot]":
            url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/issues/comments/{comment['id']}"
            request = urllib.request.Request(url, method="DELETE", headers=HEADERS)
            urllib.request.urlopen(request)


def post_comment(issue_number, message):
    delete_bot_comments(issue_number)
    url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/issues/{issue_number}/comments"
    data = json.dumps({"body": message}).encode("utf-8")
    request = urllib.request.Request(url, method="POST", headers=HEADERS, data=data)
    urllib.request.urlopen(request)


def create_commit_status(sha, state, description):
    url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/statuses/{sha}"
    data = json.dumps(
        {
            "state": state,
        }
    ).encode("utf-8")
    request = urllib.request.Request(url, method="POST", headers=HEADERS, data=data)
    urllib.request.urlopen(request)


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
    if not pull["draft"] and pull["head"] is not None:
        ref = pull["head"]["ref"]
        sha = pull["head"]["sha"]
        try:
            subprocess.run(
                ["git", "pull", pull["head"]["repo"]["clone_url"], ref], check=True
            )
        except:
            create_commit_status(
                sha,
                "failure",
                'Could not merge this into the "review" branch.',
            )
        else:
            print(f'Merged "{pull["head"]["label"]}"')
            create_commit_status(
                sha,
                "pending",
                (
                    ':heavy_check_mark: Merged this into the "review" branch. After build it '
                    "will be deployed to "
                    "[review.staging.kitspace.dev](https://review.staging.kitspace.dev)."
                ),
            )
