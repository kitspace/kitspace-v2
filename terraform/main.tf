locals {
  branches = terraform.workspace == "production" ? ["production"] : [
    "kaspar-dev", "abdo-dev", "review", "master"
  ]
}

module "server" {
  source      = "./server"
  for_each    = local.branches
  branch_name = each.value
}
