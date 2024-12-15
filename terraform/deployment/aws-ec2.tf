resource "aws_instance" "instance" {
  # Ubuntu, 22.04 LTS, amd64 jammy image built on 2023-05-16. Owned by Canonical.
  ami           = "ami-01dd271720c1ba44f"
  instance_type = "t2.medium"
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
