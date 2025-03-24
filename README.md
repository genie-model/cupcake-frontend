# Getting Started with Your Cupcake Frontend App

## Prerequisites

Before starting, ensure you have **Node.js** and **npm** installed. These are required to run and manage the React application. If they are not installed, follow the instructions for your operating system:

### Linux (Ubuntu/Debian)

Use the following commands to install Node.js and npm:

```sh
sudo apt update  # Updates the package list to ensure you get the latest versions of available software
sudo apt install nodejs  # Installs Node.js, the JavaScript runtime required to run the app
sudo apt install npm  # Installs npm (Node Package Manager), which is used to manage project dependencies
```

### Windows

Download and install Node.js from the official website:

- [Node.js Download](https://nodejs.org/)
- The installer includes npm, so no additional installation is required.

### macOS

Install Node.js using Homebrew:

```sh
brew install node  # Installs both Node.js and npm
```

If you don’t have Homebrew installed, visit [Homebrew's website](https://brew.sh/) for installation instructions.

## Setting Up the Project

If this is your first time setting up the project, follow these steps:

### 1. Clone the Repository (if applicable)

If the project is hosted on GitHub, you need to download it to your computer using:

```sh
git clone <repository_url>  # Replaces <repository_url> with the actual project repository link
cd <project_directory>  # Moves into the project directory
```

### 2. Install Dependencies

Dependencies are external libraries the project needs to run. Install them using:

```sh
npm install  # Installs all necessary project dependencies listed in package.json
```

## Running the React Application

To start the application, navigate to the project directory and run:

```sh
npm start  # Starts the development server and runs the React app
```

Once started, open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

If you need to keep the app running even after closing the terminal, use:

```sh
sudo nohup npm start > log_file.log 2>&1 &  # Runs the app in the background, logging output to log_file.log
```

## Available Commands

### Run Tests

To test the application and check for errors:

```sh
npm test  # Runs tests in interactive mode, allowing you to debug potential issues
```

### Build for Production

To prepare the application for deployment:

```sh
npm run build  # Creates an optimized version of the app, storing it in the 'build' folder
```

The build version is minified and ready for hosting on a web server.

### Eject (Advanced Users Only)

If you need to modify internal configurations of the project:

```sh
npm run eject  # Permanently removes default React setup and exposes configuration files
```

⚠ **Warning:** This cannot be undone!

## Using PM2 for Process Management

PM2 helps keep your application running even after reboots and provides better process monitoring.

### Install PM2

```sh
sudo npm install -g pm2  # Installs PM2 globally, allowing it to manage applications
```

### Start the App with PM2

```sh
pm2 start npm --name "my-app" -- start  # Runs the React app under PM2 process manager
```

### Save the PM2 Process

```sh
pm2 save  # Saves the current PM2 process list so it restarts on reboot
pm2 startup  # Configures PM2 to start automatically when the system reboots
```

### Managing the Application

#### View Running Processes:

```sh
pm2 list  # Shows all applications running under PM2
```

#### Stop the Application:

```sh
pm2 stop my-app  # Stops the application named 'my-app'
```

## Additional Resources

- [Create React App Documentation](https://facebook.github.io/create-react-app/)
- [React Documentation](https://react.dev/)
- [PM2 Documentation](https://pm2.keymetrics.io/)

This guide simplifies the setup and ensures your app runs smoothly. 🚀


# Cupcake Frontend Docker Steps

This guide provides the steps to build, tag, push, pull, and rename Docker images for the **Cupcake Frontend** project.

---

## Steps to Build and Run the Docker Image

#### 1. Build the Docker Image
To build the Docker image, run:
```bash
docker build -t cupcake-frontend:1.0 .
```
#### 2. Run the Docker Image
To run the Docker container in detached mode with port mapping:

```
docker run -d --name cupcake-frontend-container -p 3000:3000 cupcake-frontend:1.0
```

###  Steps to Tag, Push, and Configure Docker Image in Google Cloud
#### 1. Tag the Docker Image
Assign a tag to the Docker image for Google Container Registry:

```
docker tag cupcake-frontend:1.0 us-west2-docker.pkg.dev/ucr-ursa-major-ridgwell-lab/cupcake/cupcake-frontend:1.0
```
#### 2. Configure Docker for Google Cloud
1. Configure Docker to authenticate with Google Container Registry:
```
gcloud auth configure-docker us-west2-docker.pkg.dev
```
2. Push the Docker Image
Push the tagged Docker image to Google Container Registry:
```
docker push us-west2-docker.pkg.dev/ucr-ursa-major-ridgwell-lab/cupcake/cupcake-frontend:1.0
```
3. Pull the Docker Image
a. On the Same Machine as the Push:
If you are on the same machine where the image was pushed, use:
```
docker pull us-west2-docker.pkg.dev/ucr-ursa-major-ridgwell-lab/cupcake/cupcake-frontend:1.0
```
b. On a Different Machine or Account:
If pulling from another machine or account with appropriate permissions (especially with sudo):

Create the .docker directory for root:
```
sudo mkdir -p /root/.docker
```
Copy the config.json for Docker authentication:
```
sudo cp ~/.docker/config.json /root/.docker/config.json
```
Pull the Docker image:
```
sudo docker pull us-west2-docker.pkg.dev/ucr-ursa-major-ridgwell-lab/cupcake/cupcake-frontend:1.0
```
#### 3. Rename the Docker Image

To rename the pulled image for local use:
```
docker tag us-west2-docker.pkg.dev/ucr-ursa-major-ridgwell-lab/cupcake/cupcake-frontend:1.0 cupcake-frontend:1.0
```
# Notes
1. Ensure you have sufficient permissions to access Google Container Registry.
2. Adjust the version tag (1.0) as required for different builds.
3. Use sudo for Docker commands if necessary in your environment.



# 🧁 CupCake Frontend - Kubernetes Deployment Guide

This guide outlines how to deploy the CupCake Frontend application on a Google Kubernetes Engine (GKE) cluster.

---

## 🚀 **1. Prerequisites**
Ensure you have the following installed:

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- [kubectl](https://kubernetes.io/docs/tasks/tools/) for Kubernetes
- [GKE Auth Plugin](https://cloud.google.com/kubernetes-engine/docs/how-to/cluster-access-for-kubectl#install_plugin)

To verify installations:
```bash
gcloud version
kubectl version --client
```

---

## ☁️ **2. Deploy CupCake Frontend to GKE**

### **2.1 Enable GKE and Create Cluster**
Ensure GKE API is enabled:
```bash
gcloud services enable container.googleapis.com
```

Create GKE cluster(it is already created, create only if new cluster needs to be created):
```bash
gcloud container clusters create cupcake-cluster \
    --region us-west2 \
    --num-nodes=2 \
    --enable-autoupgrade
```

Connect `kubectl` to the cluster:
```bash
gcloud container clusters get-credentials cupcake-cluster --region us-west2
```

---

### **2.2 Deploy Frontend App to GKE**

1. **Push Docker image to Google Artifact Registry (GAR):**
```bash
gcloud auth configure-docker us-west2-docker.pkg.dev

# Tag and push the image
docker tag cupcake-frontend:1.0 us-west2-docker.pkg.dev/ucr-ursa-major-ridgwell-lab/cupcake/cupcake-frontend:1.0
docker push us-west2-docker.pkg.dev/ucr-ursa-major-ridgwell-lab/cupcake/cupcake-frontend:1.0
```

2. **Create Kubernetes manifests:(needs to be done only once per cluster) **
- `deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cupcake-frontend-deployment
  labels:
    app: cupcake-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cupcake-frontend
  template:
    metadata:
      labels:
        app: cupcake-frontend
    spec:
      containers:
      - name: cupcake-frontend
        image: us-west2-docker.pkg.dev/ucr-ursa-major-ridgwell-lab/cupcake/cupcake-frontend:1.0
        ports:
        - containerPort: 3000
        env:
        - name: API_URL
          value: "http://cupcake.ctoaster.org:8000"
        imagePullPolicy: Always
```

- `service.yaml`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: cupcake-frontend-service
spec:
  type: LoadBalancer
  ports:
    - port: 80
      targetPort: 3000
  selector:
    app: cupcake-frontend
```

3. **Deploy to GKE:**
```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

4. **Check status:**
```bash
kubectl get pods
kubectl get svc
```

Expected output:
```
NAME                                           READY   STATUS    RESTARTS   AGE
cupcake-frontend-deployment-abc123              1/1     Running   0          10s
```

**Find External IP:**
```bash
kubectl get svc
```
Expected output:
```
NAME                       TYPE           CLUSTER-IP      EXTERNAL-IP     PORT(S)        AGE
cupcake-frontend-service   LoadBalancer   34.118.232.251  34.94.127.96    80:31234/TCP   5m
```

Access the app:
```
http://34.94.127.96
```

---

# ⚖️ 3 Scaling with Horizontal Pod Autoscaler (HPA)

This guide explains how to automatically scale the number of pods for your Kubernetes deployment based on CPU utilization.

---

### 📌 3.1 Prerequisites

Ensure the following are configured:

- Your Kubernetes deployment defines CPU `requests` and `limits`.
- The **metrics server** is installed. You can install it using:

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

---

### 📄 3.2 Create the HPA YAML

Create a file named `hpa.yaml` with the following contents:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: cupcake-frontend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: cupcake-frontend-deployment
  minReplicas: 2
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
```

---

### 🚀 3.3 Apply HPA

Apply the HPA configuration to your cluster:

```bash
kubectl apply -f hpa.yaml
```

---

### 🔍 3.4 Monitor HPA

Check the current status and behavior of the HPA using:

```bash
kubectl get hpa
kubectl top pods
```

---

## 🔍 **4. Monitoring & Troubleshooting**

1. **Check pod status:**
```bash
kubectl get pods
```

2. **View pod logs:**
```bash
kubectl logs -f <pod-name>
```

3. **Check deployment:**
```bash
kubectl describe deployment cupcake-frontend-deployment
```

4. **Check service and external IP:**
```bash
kubectl get svc
```

---

## 🧹 **5. Cleanup (Optional)**
To delete the GKE cluster and avoid billing:
```bash
# Delete cluster
gcloud container clusters delete cupcake-cluster --region us-west2

# Delete Docker image from GAR
gcloud artifacts docker images delete us-west2-docker.pkg.dev/ucr-ursa-major-ridgwell-lab/cupcake/cupcake-frontend:1.0
```

---

## 📞 **6. Support**
For any issues or further assistance:
- Check GKE logs: `kubectl describe pod <pod-name>`
- Visit [Google Kubernetes Engine Docs](https://cloud.google.com/kubernetes-engine/docs)
- Contact the project admin or Slack channel.

---

🎉 **That's it! Your CupCake frontend is now running on Kubernetes!**

