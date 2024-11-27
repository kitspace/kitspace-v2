terraform {
  required_providers {
    bunnynet = {
      source = "BunnyWay/bunnynet"
    }
  }
}

variable "bunny_api_key" {
  description = "Bunny API key"
  type        = string
  sensitive   = true
}

provider "bunnynet" {
  api_key = var.bunny_api_key
}

locals {
  environments = ["kaspar-dev", "abdo-dev", "master", "review"]
}

resource "bunnynet_pullzone" "frontend" {
  for_each = toset(local.environments)
  name     = "frontend-${each.value}"
  cors_extensions = [
    "css",
    "eot",
    "gif",
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
    url  = "https://${each.value}.staging.kitspace.dev"
  }

  routing {
    tier = "Standard"
  }
}

resource "bunnynet_pullzone_hostname" "frontend-cdn" {
  for_each    = toset(local.environments)
  pullzone    = bunnynet_pullzone.frontend[each.value].id
  name        = "frontend-cdn.${each.value}.staging.kitspace.dev"
  tls_enabled = true
  force_ssl   = true
}

resource "bunnynet_pullzone" "processor" {
  for_each = toset(local.environments)
  name     = "processor-${each.value}"
  cors_extensions = [
    "css",
    "eot",
    "gif",
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
    url  = "https://kitspace-staging-${each.value}.s3.amazonaws.com"
  }

  routing {
    tier = "Standard"
  }
}

resource "bunnynet_pullzone_hostname" "processor-cdn" {
  for_each    = toset(local.environments)
  pullzone    = bunnynet_pullzone.processor[each.value].id
  name        = "processor-cdn.${each.value}-3.staging.kitspace.dev"
  tls_enabled = true
  force_ssl   = true
}
