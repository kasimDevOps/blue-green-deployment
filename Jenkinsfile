pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds') // DockerHub creds
        GITHUB_CREDENTIALS = credentials('github-creds')       // GitHub token
        APP_NAME = "myapp"
        BLUE_ENV = "blue"
        GREEN_ENV = "green"
        DOCKER_REPO = "myrepo"                                 // DockerHub repo
        GIT_REPO = "https://github.com/kasimDevOps/blue-green-deployment.git"
        BRANCH = "main"                                        // Git branch
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: "${BRANCH}", credentialsId: 'github-creds', url: "${GIT_REPO}"
            }
        }

        stage('Build Docker Images') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    sh """
                        echo "Building frontend image..."
                        docker build --progress=plain -t ${DOCKER_REPO}/frontend:latest ./frontend
                        echo "Building backend image..."
                        docker build --progress=plain -t ${DOCKER_REPO}/backend:latest ./backend
                    """
                }
            }
        }

        stage('Push Docker Images') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    sh """
                        echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin
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
                        echo "Deploying Green environment..."
                        kubectl apply -f k8s/deployment-green.yaml --v=6
                        kubectl apply -f k8s/service-green.yaml --v=6
                    """
                }
            }
        }

        stage('Test Green') {
            steps {
                timeout(time: 2, unit: 'MINUTES') {
                    retry(3) { // retry 3 times if curl fails
                        sh 'curl -f http://green.${APP_NAME}.example.com/health || exit 1'
                    }
                }
            }
        }

        stage('Switch Traffic to Green') {
            steps {
                timeout(time: 3, unit: 'MINUTES') {
                    sh 'kubectl apply -f k8s/service-switch-green.yaml --v=6'
                }
            }
        }

        stage('Cleanup Blue') {
            steps {
                timeout(time: 3, unit: 'MINUTES') {
                    sh "kubectl scale deployment ${APP_NAME}-${BLUE_ENV} --replicas=0 --v=6"
                }
            }
        }
    }

    post {
        failure {
            echo "Deployment failed, rolling back to Blue..."
            sh 'kubectl apply -f k8s/service-switch-blue.yaml --v=6 || echo "Rollback failed"'
        }
    }
}
