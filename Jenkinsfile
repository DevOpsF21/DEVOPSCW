pipeline {
    agent any

    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'Zaied', url: 'https://github.com/DevOpsF21/DEVOPSCW.git'
            }
        }
        
        stage('Build and Run Module 1') {
            steps {
                dir('authmodule') {
                    script {
                        // Build Docker image
                        sh 'docker build -t authimg .'
                        
                        // Push Docker image to registry
                        sh 'docker push authimg'
                        
                        // Run Docker container
                        sh 'docker run -d -p 7070:3000 authimg'
                    }
                }
            }
        }

        stage('Build and Run Module 2') {
            steps {
                dir('regmodule') {
                    script {
                        // Build Docker image
                        sh 'docker build -t regimg .'
                        
                        // Push Docker image to registry
                        sh 'docker push regimg'
                        
                        // Run Docker container
                        sh 'docker run -d -p 9090:3000 regimg'
                    }
                }
            }
        }

        stage('Build and Run Module 3') {
            steps {
                dir('wardmodule') {
                    script {
                        // Build Docker image
                        sh 'docker build -t wardimg .'
                        
                        // Push Docker image to registry
                        sh 'docker push wardimg'
                        
                        // Run Docker container
                        sh 'docker run -d -p 5050:3000 wardimg'
                    }
                }
            }
        }
        
        stage('Test with Postman') {
            steps {
                // Execute Postman tests here
                // Example:
                // sh 'newman run <collection-file>.json -e <environment-file>.json'
            }
        }
    }
}
