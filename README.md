SmartAttend — AI-Powered Serverless Attendance Management System

SmartAttend is a cloud-native attendance management platform built using Next.js and AWS Serverless Services.
The system uses AI-powered facial recognition to automate attendance marking with secure authentication, cloud storage, and real-time analytics.

Features
AI-powered facial recognition attendance
Live camera attendance verification
Image upload attendance verification
Secure authentication with AWS Cognito
Email verification & JWT authentication
Attendance dashboard & analytics
Attendance history management
Admin monitoring panel
Real-time attendance tracking
Responsive dark-themed UI
Fully serverless backend architecture
AWS Services Used
AWS Amplify — Frontend hosting & CI/CD
Amazon Cognito — Authentication & user management
Amazon Rekognition — Facial recognition
AWS Lambda — Serverless backend processing
Amazon API Gateway — REST API management
Amazon DynamoDB — Attendance & user data storage
Amazon S3 — Image storage
Amazon CloudWatch — Logging & monitoring
Tech Stack
Next.js
React
TypeScript
AWS SDK
Tailwind CSS
Node.js
Architecture
Frontend (Next.js + Amplify)
        ↓
Amazon Cognito Authentication
        ↓
API Gateway
        ↓
AWS Lambda
        ↓
Rekognition + DynamoDB + S3
Project Screens
Authentication System
AI Attendance Marking
Attendance Dashboard
Attendance History
Admin Panel
Real-Time Analytics
Installation & Setup
1. Clone Repository
git clone YOUR_GITHUB_REPO_LINK
cd smartattend
2. Install Dependencies
npm install
3. Configure Environment Variables

Create .env.local

NEXT_PUBLIC_AWS_REGION=ap-south-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=YOUR_USER_POOL_ID
NEXT_PUBLIC_COGNITO_CLIENT_ID=YOUR_CLIENT_ID

NEXT_PUBLIC_S3_BUCKET_NAME=YOUR_BUCKET_NAME
NEXT_PUBLIC_S3_REGION=ap-south-1

S3_BUCKET_NAME=YOUR_BUCKET_NAME
S3_REGION=ap-south-1

APP_ACCESS_KEY_ID=YOUR_ACCESS_KEY
APP_SECRET_ACCESS_KEY=YOUR_SECRET_KEY

NEXT_PUBLIC_ATTENDANCE_API_URL=YOUR_API_GATEWAY_URL
Run Locally
npm run dev
Build Project
npm run build
Deploy on AWS Amplify
Push project to GitHub
Open AWS Amplify
Connect GitHub repository
Add environment variables
Deploy application
Key Functionalities
Authentication
User Signup
Email Verification
Login/Logout
JWT Session Management
Attendance System
Live Camera Recognition
Image Upload Verification
AI Confidence Scoring
Attendance Status Tracking
Admin Features
User Monitoring
Attendance Analytics
Attendance Reports
Dashboard Insights
Learning Outcomes

This project helped strengthen practical knowledge in:

AWS Serverless Architecture
Cloud-Native Application Development
AI Service Integration
Authentication Workflows
Scalable Backend Design
CI/CD Deployment Pipelines
Cloud Monitoring & Debugging
Future Improvements
Multi-face attendance support
Real-time notifications
Geo-location verification
Role-based access control
Attendance export to PDF/Excel
Advanced analytics dashboard
Author

Aayush Vishwakarma
Cloud & DevOps Engineer | AWS Cloud Enthusiast

GitHub: https://github.com/Aayushv877
LinkedIn: https://www.linkedin.com/in/aayush-vishwakarma-1272ab316

License

This project is for educational and portfolio purposes.
