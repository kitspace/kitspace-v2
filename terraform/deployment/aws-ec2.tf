variable "branch_name" {
  type = string
}

terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

provider "aws" {
  region = "eu-west-1"
}

data "aws_ami" "ubuntu_22_04" {
  # Canonical's AWS account ID
  owners      = ["099720109477"]
  most_recent = true
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "instance" {
  ami           = data.aws_ami.ubuntu_22_04.id
  instance_type = "t2.medium"
  tags = {
    "Name" = branch_name
  }
}

# reserved IP
resource "aws_eip" "instance_ip" {
  instance = aws_instance.instance[each.value].id
  tags = {
    "Name" = branch_name
  }
}

output "ip" {
  value = aws_eip.instance_ip.public_ip
}
