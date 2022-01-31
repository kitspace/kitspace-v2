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


def get_pulls(page=1):
    page_size = 30
    url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/pulls?page={page}&per_page={page_size}"
    request = urllib.request.Request(url, method="GET", headers=HEADERS)
    response = urllib.request.urlopen(request).read()
    pulls = json.loads(response)
    if len(pulls) == page_size:
        pulls += get_pulls(page=page + 1)
    return pulls


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


def get_last_commit_status_state(sha):
    states = [
        status["state"]
        for status in get_commit_statuses(sha)
        if status["context"] == "auto-merge: review"
    ]
    if len(states) == 0:
        return None
    return states[0]


def create_commit_status(sha, state, description, target_url=GITHUB_RUN_URL):
    # don't replace a "success" status with "pending"
    if (state == "pending") and (get_last_commit_status_state(sha) == "success"):
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


def get_deployments(ref="", page=1):
    page_size = 30
    url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/deployments?environment=review.staging.kitspace.dev&ref={ref}&per_page={page_size}&page={page}"
    request = urllib.request.Request(url, method="GET", headers=HEADERS)
    response = urllib.request.urlopen(request).read()
    deployments = json.loads(response)
    if len(deployments) == page_size:
        deployments += get_deployments(ref, page + 1)
    return deployments


def get_deployment(ref):
    deployments = get_deployments(ref)
    return deployments[0] if len(deployments) > 0 else None


def delete_deployment(deployment_id):
    url = (
        f"https://api.github.com/repos/{GITHUB_REPOSITORY}/deployments/{deployment_id}"
    )
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


def get_deployment_statuses(deployment_id):
    url = f"https://api.github.com/repos/{GITHUB_REPOSITORY}/deployments/{deployment_id}/statuses"
    request = urllib.request.Request(url, method="GET", headers=HEADERS)
    response = urllib.request.urlopen(request).read()
    statuses = json.loads(response)
    return statuses


def get_last_deployment_status_state(deployment_id):
    statuses = get_deployment_statuses(deployment_id)
    if len(statuses) == 0:
        return None
    return statuses[0]["state"]
