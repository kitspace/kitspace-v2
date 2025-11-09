# Hetzner Cloud Server
resource "hcloud_server" "instance" {
  count        = var.use_hetzner ? 1 : 0
  name         = var.deployment_name
  server_type  = "cx23"  # Shared vCPU: 2 vCPU, 4GB RAM, 40GB NVMe SSD
  image        = "ubuntu-24.04"
  location     = "fsn1"
  ssh_keys     = [var.hetzner_ssh_key_id]
  firewall_ids = [var.hetzner_firewall_id]

  labels = {
    environment = var.mode
    branch      = var.deployment_name
  }

  # Enable public IPv4 (Primary IP will be auto-created)
  public_net {
    ipv4_enabled = true
    ipv6_enabled = true
  }
}
