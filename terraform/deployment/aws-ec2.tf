terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      configuration_aliases = [aws.ec2_provider]
    }
  }
}


variable "branch_name" {
  type = string
}


data "aws_ami" "ubuntu_22_04" {
  provider = aws.ec2_provider
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
  provider      = aws.ec2_provider
  ami           = data.aws_ami.ubuntu_22_04.id
  instance_type = "t2.medium"
  tags = {
    "Name" = var.branch_name
  }
}

# reserved IP
resource "aws_eip" "instance_ip" {
  provider = aws.ec2_provider
  instance = aws_instance.instance.id
  tags = {
    "Name" = var.branch_name
  }
}

output "ip" {
  value = aws_eip.instance_ip.public_ip
}
