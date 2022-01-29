import os
import sys
import json
import urllib.request
import urllib.parse

GITHUB_TOKEN = sys.argv[1]
GITHUB_REPOSITORY = os.environ["GITHUB_REPOSITORY"]
GITHUB_RUN_ID = os.environ["GITHUB_RUN_ID"]
GITHUB_RUN_URL = f"https://github.com/{GITHUB_REPOSITORY}/actions/runs/{GITHUB_RUN_ID}"

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
    url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/issues/{issue_number}/comments"
    data = json.dumps({"body": message}).encode("utf-8")
    request = urllib.request.Request(url, method="POST", headers=HEADERS, data=data)
    urllib.request.urlopen(request)


def create_commit_status(sha, state, description, target_url=GITHUB_RUN_URL):
    url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/statuses/{sha}"
    data = json.dumps(
        {
            "state": state,
            "description": description,
            "target_url": target_url,
            "context": "auto-merge: review",
        }
    ).encode("utf-8")
    request = urllib.request.Request(url, method="POST", headers=HEADERS, data=data)
    urllib.request.urlopen(request)
