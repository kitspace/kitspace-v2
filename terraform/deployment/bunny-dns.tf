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
  name  = var.mode == "production" ? (var.branch_name == "production" ? "gitea" : "gitea.${var.branch_name}") : "gitea.${var.branch_name}.staging"
  type  = "A"
  ttl   = local.dns_ttl
  value = local.instance_public_ip

  # default when adding this record via web UI
  latency_zone = "DE"

  monitor_type = "None"
}

resource "bunnynet_dns_record" "a_meilisearch" {
  zone  = var.bunnynet_dns_zone_id
  name  = var.mode == "production" ? (var.branch_name == "production" ? "meilisearch" : "meilisearch.${var.branch_name}") : "meilisearch.${var.branch_name}.staging"
  type  = "A"
  ttl   = local.dns_ttl
  value = local.instance_public_ip

  # default when adding this record via web UI
  latency_zone = "DE"

  monitor_type = "None"
}

resource "bunnynet_dns_record" "a" {
  zone  = var.bunnynet_dns_zone_id
  name  = var.mode == "production" ? (var.branch_name == "production" ? "" : var.branch_name) : "${var.branch_name}.staging"
  type  = "A"
  ttl   = local.dns_ttl
  value = local.instance_public_ip

  # default when adding this record via web UI
  latency_zone = "DE"

  monitor_type = "None"
}

resource "bunnynet_dns_record" "frontend_cdn" {
  zone  = var.bunnynet_dns_zone_id
  name  = var.mode == "production" ? (var.branch_name == "production" ? "frontend-cdn" : "frontend-cdn.${var.branch_name}") : "frontend-cdn.${var.branch_name}.staging"
  type  = "CNAME"
  ttl   = local.dns_ttl
  value = "frontend-${var.branch_name}-kitspace.b-cdn.net"

  # default when adding this record via web UI
  latency_zone = "DE"

  monitor_type = "None"
}


resource "bunnynet_dns_record" "processor_cdn" {
  zone  = var.bunnynet_dns_zone_id
  name  = var.mode == "production" ? (var.branch_name == "production" ? "processor-cdn" : "processor-cdn.${var.branch_name}") : "processor-cdn.${var.branch_name}.staging"
  type  = "CNAME"
  ttl   = local.dns_ttl
  value = "processor-${var.branch_name}-kitspace.b-cdn.net"

  # default when adding this record via web UI
  latency_zone = "DE"

  monitor_type = "None"
}
