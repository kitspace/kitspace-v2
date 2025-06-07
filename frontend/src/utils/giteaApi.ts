import getConfig from 'next/config'

export type GiteaUser = {
  id: number
  login: string
  full_name: string
  email: string
  avatar_url: string
  language: string
  is_admin: boolean
  last_login: string
  created: string
  restricted: boolean
  active: boolean
  prohibit_login: false
  location: string
  website: string
  description: string
  visibility: string
  followers_count: number
  following_count: number
  starred_repos_count: number
  username: string
}

export type GiteaRepo = {
  id: number
  owner: GiteaUser
  name: string
  full_name: string
  description: string
  empty: boolean
  private: boolean
  fork: boolean
  template: boolean
  parent: GiteaRepo | null
  mirror: boolean
  size: number
  language: string
  languages_url: string
  html_url: string
  ssh_url: string
  clone_url: string
  original_url: string
  website: string
  stars_count: number
  forks_count: number
  watchers_count: number
  open_issues_count: number
  open_pr_counter: number
  release_counter: number
  default_branch: string
  archived: boolean
  created_at: string
  updated_at: string
  permissions: {
    admin: boolean
    push: boolean
    pull: boolean
  }
  has_issues: boolean
  internal_tracker: {
    enable_time_tracker: boolean
    allow_only_contributors_to_track_time: boolean
    enable_issue_dependencies: boolean
  }
  has_wiki: boolean
  has_pull_requests: boolean
  has_projects: boolean
  ignore_whitespace_conflicts: boolean
  allow_merge_commits: boolean
  allow_rebase: boolean
  allow_rebase_explicit: boolean
  allow_squash_merge: boolean
  default_merge_style: string
  avatar_url: string
  internal: boolean
  mirror_interval: string
  mirror_updated: string
  repo_transfer: null
}

export type GiteaCommitStatus = {
  sha: string
  url: string
  statuses: Array<{
    id: number
    state: string
    target_url: string
    description: string
    context: string
    created_at: string
    updated_at: string
    creator: GiteaUser
  }>
  repository: GiteaRepo
}

const giteaApiUrl = `${getConfig().publicRuntimeConfig.KITSPACE_GITEA_URL}/api/v1`
const credentials = 'include'
const mode = 'cors'
const headers = { 'Content-Type': 'application/json' }

export async function getRepo(fullname: string): Promise<GiteaRepo | null> {
  const endpoint = `${giteaApiUrl}/repos/${fullname}`

  const res = await fetch(endpoint, {
    method: 'GET',
    credentials,
    mode,
    headers,
  })
  return res.ok ? res.json() : null
}

export async function repoExists(fullname: string): Promise<boolean> {
  const repo = await getRepo(fullname)

  return repo != null
}

export async function getUser(username: string): Promise<GiteaUser | null> {
  const endpoint = `${giteaApiUrl}/users/${username}`

  const res = await fetch(endpoint, {
    method: 'GET',
    mode,
    headers,
  })

  return res.ok ? res.json() : null
}

export async function getLatestSha(
  owner: string,
  repo: string,
): Promise<string | null> {
  const endpoint = `${giteaApiUrl}/repos/${owner}/${repo}/commits?limit=1`

  const res = await fetch(endpoint, {
    method: 'GET',
    credentials,
    mode,
    headers,
  })

  if (!res.ok) {
    return null
  }

  const commits = await res.json()
  return commits[0]?.sha || null
}
