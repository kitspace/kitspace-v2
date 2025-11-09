variable "domain" {
  type = string
}

locals {
  deployment_domain = var.mode == "production" ? var.domain : "${var.branch_name}.staging.${var.domain}"
}

resource "bunnynet_pullzone" "frontend" {
  # Skip creating CDN for pre-release (uses production's CDN)
  count = var.mode == "production" && var.branch_name == "pre-release" ? 0 : 1
  name  = "frontend-${var.branch_name}-kitspace"
  cors_extensions = [
    "css",
    "eot",
    "gif",
    "html",
    "jpeg",
    "jpg",
    "js",
    "json",
    "mp3",
    "mp4",
    "mpeg",
    "png",
    "svg",
    "ttf",
    "webm",
    "webp",
    "woff",
    "woff2",
    "zip",
  ]

  origin {
    type = "OriginUrl"
    url  = "https://${local.deployment_domain}"
  }

  routing {
    tier = "Standard"
  }

  log_forward_enabled = false
}

resource "bunnynet_pullzone_hostname" "frontend_cdn" {
  # Skip creating CDN hostname for pre-release
  count       = var.mode == "production" && var.branch_name == "pre-release" ? 0 : 1
  pullzone    = bunnynet_pullzone.frontend[0].id
  name        = "frontend-cdn.${local.deployment_domain}"
  tls_enabled = true
  force_ssl   = true
}

resource "bunnynet_pullzone" "processor" {
  # Skip creating CDN for pre-release (uses production's CDN)
  count = var.mode == "production" && var.branch_name == "pre-release" ? 0 : 1
  name  = "processor-${var.branch_name}-kitspace"
  cors_extensions = [
    "css",
    "eot",
    "gif",
    "html",
    "jpeg",
    "jpg",
    "js",
    "json",
    "mp3",
    "mp4",
    "mpeg",
    "png",
    "svg",
    "ttf",
    "webm",
    "webp",
    "woff",
    "woff2",
    "zip",
  ]

  origin {
    type = "OriginUrl"
    url  = "https://${local.bucket_name}.s3.amazonaws.com"
  }

  routing {
    tier = "Standard"
  }

  log_forward_enabled = false
}

resource "bunnynet_pullzone_hostname" "processor_cdn" {
  # Skip creating CDN hostname for pre-release
  count       = var.mode == "production" && var.branch_name == "pre-release" ? 0 : 1
  pullzone    = bunnynet_pullzone.processor[0].id
  name        = "processor-cdn.${local.deployment_domain}"
  tls_enabled = true
  force_ssl   = true
}
