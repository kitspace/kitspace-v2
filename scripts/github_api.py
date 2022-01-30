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


def get_commit_statuses(sha, page=1):
    page_size = 30
    url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/commits/{sha}/statuses?page={page}&per_page={page_size}"
    request = urllib.request.Request(url, method="GET", headers=HEADERS)
    response = urllib.request.urlopen(request).read()
    statuses = json.loads(response)
    if len(statuses) == page_size:
        statuses += get_commit_statuses(sha, page=page + 1)
    return statuses


def has_success_commit_status(sha):
    statuses = get_commit_statuses(sha)
    for status in statuses:
        if status["context"] == "auto-merge: review" and status["state"] == "success":
            return True
    return False


def create_commit_status(sha, state, description, target_url=GITHUB_RUN_URL):
    # don't replace a "success" status with "pending"
    if state == "pending" and has_success_commit_status(sha):
        return

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


def create_deployment(ref):
    url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/deployments"
    data = json.dumps(
        {
            "ref": ref,
            "auto_merge": False,
            "environment": "review.staging.kitspace.dev",
            "required_contexts": [],
        }
    ).encode("utf-8")
    request = urllib.request.Request(url, method="POST", headers=HEADERS, data=data)
    response = urllib.request.urlopen(request).read()
    return json.loads(response)

def get_deployments(page=1):
    page_size = 30
    url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/deployments?environment=review.staging.kitspace.dev&per_page={page_size}&page={page}"
    request = urllib.request.Request(url, method="GET", headers=HEADERS)
    response = urllib.request.urlopen(request).read()
    deployments = json.loads(response)
    if len(deployments) == page_size:
        deployments += get_deployments(page + 1)
    return deployments


def get_deployment(ref):
    url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/deployments?ref={ref}&environment=review.staging.kitspace.dev"
    request = urllib.request.Request(url, method="GET", headers=HEADERS)
    response = urllib.request.urlopen(request).read()
    deployments = json.loads(response)
    return deployments[0] if len(deployments) > 0 else None


def delete_deployment(deployment_id):
    url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/deployments/{deployment_id}"
    request = urllib.request.Request(url, method="DELETE", headers=HEADERS)
    urllib.request.urlopen(request)


def create_deployment_status(deployment_id, state):
    url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/deployments/{deployment_id}/statuses"
    data = json.dumps(
        {
            "state": state,
            "log_url": GITHUB_RUN_URL,
            "environment_url": "https://review.staging.kitspace.dev",
            "auto_inactive": False,
        }
    ).encode("utf-8")
    request = urllib.request.Request(url, method="POST", headers=HEADERS, data=data)
    response = urllib.request.urlopen(request).read()
    return json.loads(response)
