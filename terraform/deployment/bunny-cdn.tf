variable "domain" {
  type = string
}

locals {
  deployment_domain = var.mode == "production" ? var.domain : "${var.branch_name}.staging.${var.domain}"
}

resource "bunnynet_pullzone" "frontend" {
  name = "frontend-${var.branch_name}-kitspace"
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
  # added to work around some bug in bunnynet provider
  log_forward_server = "logs.example.com"
}

resource "bunnynet_pullzone_hostname" "frontend_cdn" {
  pullzone    = bunnynet_pullzone.frontend.id
  name        = "frontend-cdn.${local.deployment_domain}"
  tls_enabled = true
  force_ssl   = true
}

resource "bunnynet_pullzone" "processor" {
  name = "processor-${var.branch_name}-kitspace"
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
    url  = "https://${aws_s3_bucket.processor_bucket.bucket}.s3.amazonaws.com"
  }

  routing {
    tier = "Standard"
  }

  log_forward_enabled = false
  # added to work around some bug in bunnynet provider
  log_forward_server = "logs.example.com"
}

resource "bunnynet_pullzone_hostname" "processor_cdn" {
  pullzone    = bunnynet_pullzone.processor.id
  name        = "processor-cdn.${local.deployment_domain}"
  tls_enabled = true
  force_ssl   = true
}
