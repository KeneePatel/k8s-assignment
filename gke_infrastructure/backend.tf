terraform {
  backend "gcs" {
    bucket  = "k8s-assignment-backend-bucket"
    prefix  = "tfstate"
  }
}

