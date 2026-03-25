output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.zerodha_server.public_ip
}

output "grafana_url" {
  description = "URL to access Grafana"
  value       = "http://${aws_instance.zerodha_server.public_ip}:3000"
}

output "ssh_command" {
  description = "Command to SSH into the instance"
  value       = "ssh -i ${var.key_name}.pem ubuntu@${aws_instance.zerodha_server.public_ip}"
}
