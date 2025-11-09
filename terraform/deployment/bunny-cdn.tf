variable "domain" {
  type = string
}

locals {
  deployment_domain = var.mode == "production" ? var.domain : "${var.deployment_name}.staging.${var.domain}"
}

resource "bunnynet_pullzone" "frontend" {
  # Create CDN for staging and legacy deployment (pre-release uses legacy's CDN)
  count = var.mode == "production" && var.deployment_name == "pre-release" ? 0 : 1
  name  = var.deployment_name == "legacy" ? "frontend-production-kitspace" : "frontend-${var.deployment_name}-kitspace"
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
  # Create CDN hostname for staging and legacy deployment (pre-release uses legacy's CDN)
  count       = var.mode == "production" && var.deployment_name == "pre-release" ? 0 : 1
  pullzone    = bunnynet_pullzone.frontend[0].id
  name        = "frontend-cdn.${local.deployment_domain}"
  tls_enabled = true
  force_ssl   = true
}

resource "bunnynet_pullzone" "processor" {
  # Create CDN for staging and legacy deployment (pre-release uses legacy's CDN)
  count = var.mode == "production" && var.deployment_name == "pre-release" ? 0 : 1
  name  = var.deployment_name == "legacy" ? "processor-production-kitspace" : "processor-${var.deployment_name}-kitspace"
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
  # Create CDN hostname for staging and legacy deployment (pre-release uses legacy's CDN)
  count       = var.mode == "production" && var.deployment_name == "pre-release" ? 0 : 1
  pullzone    = bunnynet_pullzone.processor[0].id
  name        = "processor-cdn.${local.deployment_domain}"
  tls_enabled = true
  force_ssl   = true
}
