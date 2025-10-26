pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds') // DockerHub creds in Jenkins
        GITHUB_CREDENTIALS = credentials('github-creds')       // GitHub token
        APP_NAME = "myapp"
        BLUE_ENV = "blue"
        GREEN_ENV = "green"
        DOCKER_USER = "kasimrock64"                             // Your DockerHub username
        DOCKER_REPO = "${DOCKER_USER}"                          // DockerHub repo prefix
        GIT_REPO = "https://github.com/kasimDevOps/blue-green-deployment.git"
        BRANCH = "main"
    }

    stages {

        stage('Checkout') {
            steps {
                echo "Checking out code from GitHub..."
                git branch: "${BRANCH}", credentialsId: 'github-creds', url: "${GIT_REPO}"
            }
        }

        stage('Build Docker Images') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    sh """
                        echo "Building frontend image..."
                        docker build -t ${DOCKER_REPO}/frontend:latest ./frontend

                        echo "Building backend image..."
                        docker build -t ${DOCKER_REPO}/backend:latest ./backend
                    """
                }
            }
        }

        stage('Push Docker Images') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    sh """
                        echo "Logging into DockerHub..."
                        echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKER_USER --password-stdin
                        
                        echo "Pushing Docker images..."
                        docker push ${DOCKER_REPO}/frontend:latest
                        docker push ${DOCKER_REPO}/backend:latest
                    """
                }
            }
        }

        stage('Deploy to Green') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    sh """
                        echo "Deploying to Green environment..."
                        kubectl apply -f k8s/deployment-green.yaml
                        kubectl apply -f k8s/service-green.yaml
                    """
                }
            }
        }

        stage('Test Green Environment') {
            steps {
                timeout(time: 2, unit: 'MINUTES') {
                    retry(3) {
                        echo "Testing Green environment health endpoint..."
                        sh 'curl -f http://green.${APP_NAME}.example.com/health || exit 1'
                    }
                }
            }
        }

        stage('Switch Traffic to Green') {
            steps {
                timeout(time: 3, unit: 'MINUTES') {
                    echo "Switching traffic from Blue to Green..."
                    sh 'kubectl apply -f k8s/service-switch-green.yaml'
                }
            }
        }

        stage('Cleanup Blue Environment') {
            steps {
                timeout(time: 3, unit: 'MINUTES') {
                    echo "Cleaning up Blue environment..."
                    sh "kubectl scale deployment ${APP_NAME}-${BLUE_ENV} --replicas=0"
                }
            }
        }
    }

    post {
        failure {
            echo "Deployment failed ❌ Rolling back to Blue environment..."
            sh '''
                echo "Rolling back traffic to Blue..."
                kubectl apply -f k8s/service-switch-blue.yaml || echo "Rollback failed"
            '''
        }
        success {
            echo "✅ Blue-Green deployment completed successfully! Now serving traffic from Green."
        }
    }
}
