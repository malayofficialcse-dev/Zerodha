variable "resource_group_name" {
  type        = string
  description = "The name of the Azure Resource Group."
  default     = "zerodha-rg"
}

variable "location" {
  type        = string
  description = "The Azure region where resources will be provisioned."
  default     = "East US"
}

variable "acr_name" {
  type        = string
  description = "The name of the Azure Container Registry (must be globally unique, alphanumeric only)."
  default     = "zerodhaacr1234"
}

variable "aks_cluster_name" {
  type        = string
  description = "The name of the AKS (Azure Kubernetes Service) cluster."
  default     = "zerodha-aks-cluster"
}

variable "dns_prefix" {
  type        = string
  description = "DNS prefix for the AKS cluster."
  default     = "zerodhaaks"
}

variable "node_count" {
  type        = number
  description = "The number of worker nodes to provision in the AKS system node pool."
  default     = 2
}

variable "node_vm_size" {
  type        = string
  description = "The size of the Virtual Machines for the AKS nodes."
  default     = "Standard_D2s_v5"
}

variable "vnet_address_space" {
  type        = list(string)
  description = "The address space for the Virtual Network."
  default     = ["10.240.0.0/16"]
}

variable "subnet_address_prefix" {
  type        = list(string)
  description = "The address prefix for the AKS subnet."
  default     = ["10.240.0.0/22"]
}
