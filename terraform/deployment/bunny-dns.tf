variable "bunnynet_dns_zone_id" {
  type = string
}

resource "bunnynet_dns_record" "a_wildcard" {
  zone  = var.bunnynet_dns_zone_id
  name  = "*.${var.branch_name}.staging"
  type  = "A"
  ttl   = 1800
  value = aws_eip.instance_ip.public_ip
  # defaults when adding this record via web UI
  latency_zone = "DE"
  monitor_type = "Ping"
}

resource "bunnynet_dns_record" "a" {
  zone  = var.bunnynet_dns_zone_id
  name  = "${var.branch_name}.staging"
  type  = "A"
  ttl   = 1800
  value = aws_eip.instance_ip.public_ip
  # defaults when adding this record via web UI
  latency_zone = "DE"
  monitor_type = "Ping"
}

resource "bunnynet_dns_record" "frontend_cdn" {
  zone  = var.bunnynet_dns_zone_id
  name  = "frontend-cdn.${var.branch_name}.staging"
  type  = "CNAME"
  ttl   = 1800
  value = "frontend-${var.branch_name}-kitspace.b-cdn.net"
  # defaults when adding this record via web UI
  latency_zone = "DE"
  monitor_type = "None"
}


resource "bunnynet_dns_record" "processor_cdn" {
  zone  = var.bunnynet_dns_zone_id
  name  = "processor-cdn.${var.branch_name}.staging"
  type  = "CNAME"
  ttl   = 1800
  value = "processor-${var.branch_name}-kitspace.b-cdn.net"
  # defaults when adding this record via web UI
  latency_zone = "DE"
  monitor_type = "None"
}
