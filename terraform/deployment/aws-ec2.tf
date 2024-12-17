variable "kitspace_server_security_group_id" {
  type = string
}

variable "ec2_instance_ssh_key_name" {
  type = string
}

resource "aws_instance" "instance" {
  # Ubuntu, 22.04 LTS, amd64 jammy image built on 2023-05-16. Owned by Canonical.
  ami           = "ami-01dd271720c1ba44f"
  instance_type = "t2.medium"
  vpc_security_group_ids = [
    var.kitspace_server_security_group_id,
  ]
  key_name = var.ec2_instance_ssh_key_name
  root_block_device {
    volume_size = var.branch_name == "production" ? 120 : 60
    tags = {
      "Name" = var.branch_name
    }
  }
  tags = {
    "Name" = var.branch_name
  }
}

# reserved IP
resource "aws_eip" "instance_ip" {
  instance = aws_instance.instance.id
  tags = {
    "Name" = var.branch_name
  }
}
