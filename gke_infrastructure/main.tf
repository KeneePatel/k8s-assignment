resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = "k8s-assignment-repo"
  description   = "Docker repository for k8s assignment"
  format        = "DOCKER"
}

resource "google_container_cluster" "primary" {
  name     = "k8s-assignment"
  location = var.region

  deletion_protection = false

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = "default"
  subnetwork = "default"
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "k8s-assignment-node-pool"
  location   = var.region
  cluster    = google_container_cluster.primary.name
  node_count = 1

  node_config {
    machine_type = "e2-medium"
    disk_type    = "pd-standard"
    disk_size_gb = 10

    image_type = "cos_containerd"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}

# Create a persistent disk for the assignment
resource "google_compute_disk" "persistent_disk" {
  name  = "k8s-assignment-pd"
  type  = "pd-standard"
  zone  = "${var.region}-a"
  size  = 1
}

