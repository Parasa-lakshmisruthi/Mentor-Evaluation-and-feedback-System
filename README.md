# Mentor-Evaluation-and-feedback-System
Mentor Evaluation and Feedback System: A simple full-stack web app where students can log in using Excel credentials, select a mentor, and submit structured feedback. The frontend is hosted on AWS S3, and the backend uses AWS Lambda + SES to email mentor feedback.

This is a complete web-based system where students submit feedback to their mentors securely. The system includes:

## ✅ Features
- Login using Excel (XLSX) credentials.
- Choose mentor from a visually rich card grid.
- Fill out a detailed feedback form.
- Feedback sent directly to mentor’s email via AWS SES.
- Hosted frontend on AWS S3.
- Backend on AWS Lambda (serverless).

## 🌐 Frontend
- HTML + CSS + JS (no framework)
- 👉 [Click to open hosted on s3](https://mentor-feedback-system.s3.ap-south-1.amazonaws.com/combined.html)


---
- AWS Lambda function (Node.js)
- Uses AWS SES to send emails to mentors.
- CORS enabled and secured via IAM permissions.

## 📁 Files
- `combined.html` – complete UI and logic.
- `lambda.js` – AWS Lambda function for SES emailing.
- `students.xlsx` – Excel file with sample login data.
- `images/` – Mentor profile images.
- `README.md` – This file.

## 🛡 IAM & Security
- Lambda has IAM permission to send email via SES.
- CORS configuration added to Lambda URL.
- S3 bucket is public for frontend (read-only).
---

## ⚠️ If the hosted link does not work

You can open the file manually:[file:///C:/Users/sruth/OneDrive/Desktop/lastproject/codeuu/combined.html]

1. Download or clone this repository
2. Go to the `codeuu` folder
3. Double-click the file:  
   `combined.html`

Or open it using this path in your browser:


## ✉️ Contact
For improvements or issues, open a GitHub issue or reach out.
Email: sruthiparasa@gmail



