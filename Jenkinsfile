pipeline {
    agent any
    
    stages {
        stage('Build and Push Docker Images') {
            steps {
                script {
                    // Build and push Docker images for each microservice
                    docker.build('authmodule', './authmodule')
                    docker.build('regmodule', './regmodule')
                    docker.build('wardmodule', './wardmodule')
                    
                    docker.withRegistry('https://your-registry-url', 'your-registry-credentials') {
                        docker.image('authmodule').push('latest')
                        docker.image('regmodule').push('latest')
                        docker.image('wardmodule').push('latest')
                    }
                }
            }
        }
        stage('Deploy Microservices') {
            steps {
                // Deploy microservices using Docker-compose or Kubernetes
                sh 'kubectl apply -f deployment.yaml' // Example command for Kubernetes deployment
            }
        }
    }
}
