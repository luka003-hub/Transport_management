# Transport Data Management System (T-DMS)

## Project Overview
This is a secure **Transport Data Management System** designed to streamline fleet operations while prioritizing data integrity and cybersecurity. Developed as part of the Diploma in Cyber Security and Forensics at Zetech University, this system addresses the vulnerabilities of manual transport records against unauthorized access and data loss.

## Key Features
- **Secure Authentication:** Role-Based Access Control (RBAC) for Admins and Operators.
- **Data Encryption:** Passwords hashed using `bcrypt` and session security via `JSON Web Tokens (JWT)`.
- **Live Monitoring Dashboard:** Real-time overview of active vehicles, revenue, and security alerts.
- **Cybersecurity Focused:** Built-in protection against common vulnerabilities and activity logging for forensic auditing.

## Tech Stack
- **Frontend:** HTML5, Tailwind CSS (UI Design)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Planned)
- **Security:** Bcrypt.js, JWT, Dotenv

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.
- A modern web browser.

### Installation & Setup
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd <repository-folder>

2. Install dependencies:
    npm install

3. Configure Environment Variables:
Create a .env file in the root directory and add the following:
    PORT=3000
    JWT_SECRET=your_secret_key
    MONGO_URI=your_mongodb_uri

4. Run the application:
    npm start

The system will be accessible at http://localhost:3000.

System Documentation
Detailed system design, including Entity Relationship Diagrams (ERD) and Flowcharts, can be found in the project documentation folder.

Author
Kijiru Luka Kimathi Diploma in Cyber Security and Forensics - Zetech University

