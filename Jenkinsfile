pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds') // DockerHub creds in Jenkins
        GITHUB_CREDENTIALS = credentials('github-creds')       // GitHub token in Jenkins
        APP_NAME = "myapp"
        BLUE_ENV = "blue"
        GREEN_ENV = "green"
        DOCKER_REPO = "myrepo"                                 // DockerHub repo
        GIT_REPO = "https://github.com/kasimDevOps/blue-green-deployment.git"
        BRANCH = "main"                                        // Set your branch
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: "${BRANCH}", credentialsId: 'github-creds', url: "${GIT_REPO}"
            }
        }

        stage('Build Docker Images') {
            steps {
                sh """
                    docker build -t ${DOCKER_REPO}/frontend:latest ./frontend
                    docker build -t ${DOCKER_REPO}/backend:latest ./backend
                """
            }
        }

        stage('Push Docker Images') {
            steps {
                sh """
                    echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin
                    docker push ${DOCKER_REPO}/frontend:latest
                    docker push ${DOCKER_REPO}/backend:latest
                """
            }
        }

        stage('Deploy to Green') {
            steps {
                sh """
                    kubectl apply -f k8s/deployment-green.yaml
                    kubectl apply -f k8s/service-green.yaml
                """
            }
        }

        stage('Test Green') {
            steps {
                sh 'curl -f http://green.${APP_NAME}.example.com/health || exit 1'
            }
        }

        stage('Switch Traffic to Green') {
            steps {
                sh 'kubectl apply -f k8s/service-switch-green.yaml'
            }
        }

        stage('Cleanup Blue') {
            steps {
                sh "kubectl scale deployment ${APP_NAME}-${BLUE_ENV} --replicas=0"
            }
        }
    }

    post {
        failure {
            echo "Deployment failed, rolling back to Blue"
            sh 'kubectl apply -f k8s/service-switch-blue.yaml'
        }
    }
}
