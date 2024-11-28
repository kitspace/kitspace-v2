locals {
  environments = ["kaspar-dev", "abdo-dev", "master", "review"]
}

module "server" {
  source = "./server"
  name   = "kaspar-dev"
}
