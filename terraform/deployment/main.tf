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
