data "sentry_organization" "kitspace" {
  slug = "kitspace"
}

resource "sentry_project" "frontend" {
  name         = "frontend"
  organization = data.sentry_organization.kitspace.id
  teams = [
    "kitspace"
  ]
}

resource "sentry_project" "nginx" {
  name         = "nginx"
  organization = data.sentry_organization.kitspace.id
  teams = [
    "kitspace"
  ]
}

resource "sentry_project" "processor" {
  name         = "processor"
  organization = data.sentry_organization.kitspace.id
  teams = [
    "kitspace"
  ]
}
