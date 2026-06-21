output "resource_group_name" {
  description = "The name of the Resource Group created."
  value       = azurerm_resource_group.rg.name
}

output "acr_name" {
  description = "The name of the Azure Container Registry."
  value       = azurerm_container_registry.acr.name
}

output "acr_login_server" {
  description = "The URL of the Azure Container Registry login server (use this to tag your Docker images)."
  value       = azurerm_container_registry.acr.login_server
}

output "aks_cluster_name" {
  description = "The name of the AKS cluster."
  value       = azurerm_kubernetes_cluster.aks.name
}

output "aks_kubeconfig_cmd" {
  description = "The Azure CLI command to fetch the kubeconfig and connect to the AKS cluster."
  value       = "az aks get-credentials --resource-group ${azurerm_resource_group.rg.name} --name ${azurerm_kubernetes_cluster.aks.name}"
}

output "aks_kube_config" {
  description = "Raw kubeconfig configuration for the AKS cluster (useful for configuring external tools)."
  value       = azurerm_kubernetes_cluster.aks.kube_config_raw
  sensitive   = true
}
