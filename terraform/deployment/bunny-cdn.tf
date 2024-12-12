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
    url  = "https://${var.branch_name}.staging.kitspace.dev"
  }

  routing {
    tier = "Standard"
  }
}

resource "bunnynet_pullzone_hostname" "frontend_cdn" {
  pullzone    = bunnynet_pullzone.frontend.id
  name        = "frontend-cdn.${var.branch_name}.staging.kitspace.dev"
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
    url  = "https://kitspace-staging-${var.branch_name}-4.s3.amazonaws.com"
  }

  routing {
    tier = "Standard"
  }
}

resource "bunnynet_pullzone_hostname" "processor_cdn" {
  pullzone    = bunnynet_pullzone.processor.id
  name        = "processor-cdn.${var.branch_name}.staging.kitspace.dev"
  tls_enabled = true
  force_ssl   = true
}
