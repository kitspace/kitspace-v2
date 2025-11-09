terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
    hcloud = {
      source = "hetznercloud/hcloud"
    }
    bunnynet = {
      source = "BunnyWay/bunnynet"
    }
    github = {
      source = "integrations/github"
    }
  }
}

variable "deployment_name" {
  type = string
}

variable "mode" {
  type = string

  validation {
    condition     = contains(["staging", "production"], var.mode)
    error_message = "The mode must be either staging or production."
  }
}

variable "use_hetzner" {
  type    = bool
  default = false
}

variable "hetzner_ssh_key_id" {
  type    = string
  default = ""
}

variable "hetzner_firewall_id" {
  type    = string
  default = ""
}
