terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      configuration_aliases = [aws.ec2_provider]
    }
    bunnynet = {
      source = "BunnyWay/bunnynet"
    }
  }
}

variable "branch_name" {
  type = string
}
