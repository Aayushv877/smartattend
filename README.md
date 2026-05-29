# 🚀 SmartAttend

### AI-Powered Serverless Attendance Management System

SmartAttend is a cloud-native attendance management platform that automates attendance tracking using AI facial recognition and AWS serverless technologies.

Built with **Next.js**, **AWS Rekognition**, **AWS Cognito**, **Lambda**, and **DynamoDB**, SmartAttend provides secure authentication, real-time attendance verification, analytics, and a fully serverless architecture.

---

## ✨ Features

### 🤖 AI Attendance System

* Face recognition-based attendance
* Live camera attendance verification
* Image upload attendance verification
* AI confidence scoring
* Real-time attendance marking

### 🔐 Authentication & Security

* AWS Cognito authentication
* Email verification
* JWT-based session management
* Secure user registration and login

### 📊 Dashboard & Analytics

* Attendance dashboard
* Attendance history tracking
* Real-time analytics
* Attendance reports
* User monitoring panel

### ☁️ Cloud-Native Architecture

* Fully serverless backend
* Auto-scaling AWS services
* Secure image storage
* Monitoring and logging support

---

## 🏗️ System Architecture

```text
┌─────────────────────┐
│     Next.js UI      │
│   (AWS Amplify)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Amazon Cognito    │
│ Authentication      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   API Gateway       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    AWS Lambda       │
└───────┬─────┬───────┘
        │     │
        ▼     ▼
 DynamoDB   Rekognition
        │
        ▼
       S3
```

---

## 🛠️ Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend

* AWS Lambda
* API Gateway
* AWS SDK
* Node.js

### Database & Storage

* Amazon DynamoDB
* Amazon S3

### Authentication

* Amazon Cognito

### AI Services

* Amazon Rekognition

### Deployment

* AWS Amplify
* GitHub Actions / CI-CD

---

## ☁️ AWS Services Used

| Service            | Purpose                          |
| ------------------ | -------------------------------- |
| AWS Amplify        | Frontend Hosting & CI/CD         |
| Amazon Cognito     | Authentication & User Management |
| Amazon Rekognition | Facial Recognition               |
| AWS Lambda         | Serverless Processing            |
| API Gateway        | REST APIs                        |
| DynamoDB           | Attendance Storage               |
| Amazon S3          | Image Storage                    |
| CloudWatch         | Monitoring & Logs                |

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/smartattend.git

cd smartattend
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_AWS_REGION=ap-south-1

NEXT_PUBLIC_COGNITO_USER_POOL_ID=YOUR_USER_POOL_ID
NEXT_PUBLIC_COGNITO_CLIENT_ID=YOUR_CLIENT_ID

NEXT_PUBLIC_S3_BUCKET_NAME=YOUR_BUCKET_NAME
NEXT_PUBLIC_S3_REGION=ap-south-1

S3_BUCKET_NAME=YOUR_BUCKET_NAME
S3_REGION=ap-south-1

APP_ACCESS_KEY_ID=YOUR_ACCESS_KEY
APP_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY

NEXT_PUBLIC_ATTENDANCE_API_URL=YOUR_API_GATEWAY_URL
```

---

## ▶️ Run Locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🚀 Deployment

### AWS Amplify

1. Push code to GitHub
2. Open AWS Amplify Console
3. Connect GitHub Repository
4. Configure environment variables
5. Deploy application

---

## 📋 Core Functionalities

### Authentication

* User Registration
* Email Verification
* Login & Logout
* JWT Session Management

### Attendance Management

* Live Camera Recognition
* Image Upload Verification
* Attendance Status Tracking
* AI-Based Face Matching

### Administration

* User Monitoring
* Attendance Analytics
* Attendance Reports
* Dashboard Insights

---

## 🎯 Learning Outcomes

This project strengthened practical experience in:

* AWS Serverless Architecture
* Cloud-Native Application Development
* Facial Recognition Integration
* Authentication & Security
* Scalable Backend Design
* CI/CD Pipelines
* Cloud Monitoring & Debugging

---

## 🔮 Future Enhancements

* Multi-face attendance support
* Geo-location verification
* Role-based access control (RBAC)
* Push notifications
* Attendance export (PDF / Excel)
* Advanced analytics dashboard
* Mobile application support

---

## 👨‍💻 Author

### Aayush Vishwakarma

Cloud & DevOps Engineer | AWS Cloud Enthusiast

GitHub: https://github.com/Aayushv877

LinkedIn: https://www.linkedin.com/in/aayush-vishwakarma-1272ab316

---

## 📄 License

This project is intended for educational, learning, and portfolio purposes.
