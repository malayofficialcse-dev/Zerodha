# Azure Resource Configs
resource_group_name = "zerodha-rg"
location            = "Central India"

# Azure Container Registry (must be unique globally, alphanumeric characters only)
acr_name            = "zerodhaacr1234"

# AKS Cluster Configs
aks_cluster_name    = "zerodha-aks-cluster"
dns_prefix          = "zerodhaaks"
node_count          = 2
node_vm_size        = "Standard_D2s_v5" # Cost-effective size suitable for dev workloads
