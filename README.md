Install Node and NPM if not already present 

a. sudo apt update
b. sudo apt install nodejs
c. sudo apt install npm

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### sudo nohup npm start > log_file.log 2>&1 &

Runs the app in development mode.  
Open [http://localhost:3000](http://localhost:5000) to view it in your browser.

The page will reload when you make changes.  
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in interactive watch mode.  
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.  
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.  
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc.) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point, you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However, we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Use a Process Manager

Using a process manager like PM2 can help you keep your application running and manage restarts in case of failures:

### Install PM2:

```sh
sudo npm install -g pm2
```

### Start your application with PM2:

```sh
pm2 start npm --name "my-app" -- start
```

### Save the PM2 process list and enable the startup script:

```sh
pm2 save
pm2 startup
```

To kill the Node process managed by PM2, you can use the following commands:

    List all PM2 processes:

    sh

pm2 list

Stop the specific process:
Identify the process you want to stop from the list. You can use either the name you assigned (in this case, "my-app") or the process ID (PID).

sh

pm2 stop my-app

This updated README file should be more structured and easier to read.


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