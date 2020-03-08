# Less-codepipeline-demo

This is a repository for a very simple Node.js application that is deployed on AWS using different AWS Services like Elastic Load Balancer, ECR, ECS Fargate. It uses AWS Codepipeline to automatically build and deploy the code on ECS Fargate Cluster.

## Configure AWS Resources

In order to configure and provision the AWS resouces follow this steps:

1. Clone this repo ("less-codepipeline-demo")

2. Log into your AWS account and open 3 tabs with ESR, ECS and EC2

3. ECR

   - Create repository with the name "less-codepipeline-demo"
   - Chose newly created repository
   - Click on "view push command"
   - Follow the instructions (your's will be different depending on your region and account number):

   ```
     1. aws ecr get-login-password --region eu-central-1 --profile less-user | docker login --username AWS --password-stdin 486453932063.dkr.ecr.eu-central-1.amazonaws.com/less-codepipeline-demo
     2. docker build -t less-codepipeline-demo .
     3. docker tag less-codepipeline-demo:latest 486453932063.dkr.ecr.eu-central-1.amazonaws.com/less-codepipeline-demo:latest
     4. docker push 486453932063.dkr.ecr.eu-central-1.amazonaws.com/less-codepipeline-demo:latest
   ```

4. ECS Cluster

   - Create cluster
   - Type Fargate
   - Name it "less-demo-cluster" and do not create a VPC (we will use default VPC)
   - Click on create

5. ECS Task Definition

   - Click on Create task definition
   - Set Launch type to Fargate
   - Name it "less-codepipeline-demo"
   - Chose min. for Task memory and Task CPU
   - Click on Add Container
   - Name it "less-codepipeline-demo"
   - Open ECR in the next tab and copy repository URI
   - Place ECR Repository URI under image and add ":latest" to it
   - Set Memory limit to 128
   - Set Port Mapping to 8080. Important: This has to match the port your app is running on!
   - Under ENVIRONMENT / CPU Units add 128
   - Click on Add
   - After we added a container click on Create

6. EC2 Target Group

   - Click on Create Target Group
   - Give it the name "less-demo-tg"
   - Chose Target Type "IP"
   - Set Port to 8080. Important: This has to match the port your app is running on!
   - Set Healthy threshold to 2

7. EC2 Load Balancer

   - Create Load Balancer (ALB)
   - Name it "less-demo-alb"
   - Add 3 AZs (we want to be highly available)
   - Skip "Configure Security Settings" (we do not use https in this demo)
   - Create new security group "less-demo-albsg", Type HTTP, Port 80, Source 0.0.0.0/0. ::/0 (anywhere)
   - Configure Routing (Target Group "existing target group" - the rest will autopopulate)
   - Skip Register Targets
   - Review and click on Create

8. ECS Cluster
   - Open "less-demo-cluster"
   - Click on "Create Service"
   - Set Launch type to FARGATE
   - Service name "less-codepipeline-demo"
   - Number of tasks: 3
   - Deployment type: "Rolling update"
   - Next click on "Configure network"
   - Chose default VPC and all 3 subnets
   - Edit security group
     - Type: "Custom TCP", Port Range: 8080
   - Chose ALB
   - Container to load balance / Production listener port : "80:HTTP"
   - "Target group name": "less-demo-tg"
   - Next Step
   - No Auto scaling for this demo, click on Next
   - Create Service

Now you should have a Fargate Cluster with 3 instances running behind the Elastic Load Balancer. To check if everything is running nice and smoothly just go to EC2 tab, click on Target Groups and chose Targets Tab. You should have 3 healthy targets. The final check is to select Load Balancer on the left hand side and open DNS name in the new browser tab.

## Configure Codepipeline

First we need to create a CodeBuild project.

1. CodeBuild

   - Click on Create Build Project
   - Name it "less-demo"
   - Chose Gitub as Source provider
   - Connect to Github using OAuth
   - Select "less-codepipeline-demo" as your Github demo
   - Enable Webhook and chose PUSH event type
   - Select managed image
   - Select Linux as operating system
   - Select Standard runtime
   - Select "aws/codebuild/standard:1.0" image
   - Enable "Privileged". IMPORTANT: this will allow docker commands to be executed
   - Create new Service Role "codebuild-less-demo-service-role-12345"
   - Select "Use a buildspec file". buildspec.yaml must be in the root of your repository
   - Click on "Create build project"
   - Switch to IAM/Roles and search for"codebuild-less-demo-service-role-12345". Attach "AmazonEC2ContainerRegistryFullAccess" to it
   - Back to CodeBuild, chose your build project and click on "Start Build"

2. CodePipeline
   - Create new pipeline
   - Name it "less-demo". It will also create a new Service Role. Click on Next
   - Use GitHub as provider and connect to Github.
   - Chose your repo and master branch
   - Select "GitHub Webhooks" to automatically start pipeline. Click on Next
   - Select AWS CodeBuild as Build provider
   - Select you CodeBuild project from Step 1, Click on Next
   - Select "Amazon ECS" as Deploy provider
   - Select cluster name and service name, Click on Next
   - Review the pipeline and click on "Create pipeline"
   -
