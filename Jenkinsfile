pipeline {
    agent any

    triggers {
        // Runs when GitHub webhook sends push events to Jenkins.
        githubPush()
    }

    options {
        disableConcurrentBuilds()
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    environment {
        MAVEN_OPTS = '-Dmaven.test.failure.ignore=false'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build and Test (Java)') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'mvn -B clean verify'
                    } else {
                        bat 'mvn -B clean verify'
                    }
                }
            }
        }

        stage('Build and Test (Python)') {
            when {
                expression { fileExists('requirements.txt') }
            }
            steps {
                script {
                    if (isUnix()) {
                        sh '''
                            python3 -m pip install --upgrade pip
                            python3 -m pip install -r requirements.txt
                            python3 -m pytest -q
                        '''
                    } else {
                        bat '''
                            py -m pip install --upgrade pip
                            py -m pip install -r requirements.txt
                            py -m pytest -q
                        '''
                    }
                }
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: '**/target/surefire-reports/*.xml, **/pytest-*.xml, **/junit*.xml'
            archiveArtifacts allowEmptyArchive: true, artifacts: 'target/*.jar, target/*.war'
        }
    }
}
