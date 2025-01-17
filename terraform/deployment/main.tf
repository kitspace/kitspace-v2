terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
    bunnynet = {
      source = "BunnyWay/bunnynet"
    }
    github = {
      source = "integrations/github"
    }
  }
}

variable "branch_name" {
  type = string
}

variable "mode" {
  type = string

  validation {
    condition     = contains(["staging", "production"], var.mode)
    error_message = "The mode must be either staging or production."
  }
}
