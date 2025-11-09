variable "bunnynet_dns_zone_id" {
  type = string
}

locals {
  # Use Hetzner server primary IPv4 if available, otherwise use AWS EIP
  instance_public_ip = var.use_hetzner ? hcloud_server.instance[0].ipv4_address : aws_eip.instance_ip[0].public_ip
  # Use 1 minute TTL for production, 30 minutes for staging
  dns_ttl = var.mode == "production" ? 60 : 1800
}

resource "bunnynet_dns_record" "a_gitea" {
  zone  = var.bunnynet_dns_zone_id
  name  = var.mode == "staging" ? "gitea.${var.deployment_name}.staging" : (var.deployment_name == "legacy" ? "gitea" : "gitea.${var.deployment_name}")
  type  = "A"
  ttl   = local.dns_ttl
  value = local.instance_public_ip

  # default when adding this record via web UI
  latency_zone = "DE"

  monitor_type = "None"
}

resource "bunnynet_dns_record" "a_meilisearch" {
  zone  = var.bunnynet_dns_zone_id
  name  = var.mode == "staging" ? "meilisearch.${var.deployment_name}.staging" : (var.deployment_name == "legacy" ? "meilisearch" : "meilisearch.${var.deployment_name}")
  type  = "A"
  ttl   = local.dns_ttl
  value = local.instance_public_ip

  # default when adding this record via web UI
  latency_zone = "DE"

  monitor_type = "None"
}

resource "bunnynet_dns_record" "a" {
  zone  = var.bunnynet_dns_zone_id
  name  = var.mode == "staging" ? "${var.deployment_name}.staging" : (var.deployment_name == "legacy" ? "" : var.deployment_name)
  type  = "A"
  ttl   = local.dns_ttl
  value = local.instance_public_ip

  # default when adding this record via web UI
  latency_zone = "DE"

  monitor_type = "None"
}

resource "bunnynet_dns_record" "frontend_cdn" {
  zone  = var.bunnynet_dns_zone_id
  name  = var.mode == "staging" ? "frontend-cdn.${var.deployment_name}.staging" : (var.deployment_name == "legacy" ? "frontend-cdn" : "frontend-cdn.${var.deployment_name}")
  type  = "CNAME"
  ttl   = local.dns_ttl
  # Both legacy and pre-release use production CDN (frontend-production-kitspace), staging uses its own
  value = var.mode == "production" ? "frontend-production-kitspace.b-cdn.net" : "frontend-${var.deployment_name}-kitspace.b-cdn.net"

  # default when adding this record via web UI
  latency_zone = "DE"

  monitor_type = "None"
}


resource "bunnynet_dns_record" "processor_cdn" {
  zone  = var.bunnynet_dns_zone_id
  name  = var.mode == "staging" ? "processor-cdn.${var.deployment_name}.staging" : (var.deployment_name == "legacy" ? "processor-cdn" : "processor-cdn.${var.deployment_name}")
  type  = "CNAME"
  ttl   = local.dns_ttl
  # Both legacy and pre-release use production CDN (processor-production-kitspace), staging uses its own
  value = var.mode == "production" ? "processor-production-kitspace.b-cdn.net" : "processor-${var.deployment_name}-kitspace.b-cdn.net"

  # default when adding this record via web UI
  latency_zone = "DE"

  monitor_type = "None"
}
