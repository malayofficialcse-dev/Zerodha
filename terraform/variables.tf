variable "aws_region" {
  description = "The AWS region to deploy into"
  type        = string
  default     = "ap-south-1" # Mumbai region
}

variable "instance_type" {
  description = "EC2 Instance Type (Needs at least 2GB RAM for Kafka/Redis/Node)"
  type        = string
  default     = "t3.medium"
}

variable "key_name" {
  description = "Name of the existing AWS Key Pair to allow SSH access. You must create this in AWS first."
  type        = string
  default     = "zerodha-key" 
}
