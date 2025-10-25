pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
        APP_NAME = "myapp"
        BLUE_ENV = "blue"
        GREEN_ENV = "green"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker build -t myrepo/frontend:latest ./frontend'
                sh 'docker build -t myrepo/backend:latest ./backend'
            }
        }

        stage('Push Docker Images') {
            steps {
                sh 'docker login -u $DOCKERHUB_CREDENTIALS_USR -p $DOCKERHUB_CREDENTIALS_PSW'
                sh 'docker push myrepo/frontend:latest'
                sh 'docker push myrepo/backend:latest'
            }
        }

        stage('Deploy to Green') {
            steps {
                sh 'kubectl apply -f k8s/deployment-green.yaml'
                sh 'kubectl apply -f k8s/service-green.yaml'
            }
        }

        stage('Test Green') {
            steps {
                sh 'curl -f http://green.myapp.example.com/health || exit 1'
            }
        }

        stage('Switch Traffic to Green') {
            steps {
                sh 'kubectl apply -f k8s/service-switch-green.yaml'
            }
        }

        stage('Cleanup Blue') {
            steps {
                sh 'kubectl scale deployment $APP_NAME-$BLUE_ENV --replicas=0'
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
