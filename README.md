# UUMIS - Web-Based School Management System

UUMIS is a full-stack web-based School Management System developed for **UUM International School (UUMIS)**. The system is designed to centralise academic, administrative, communication, and financial processes into one integrated platform. It provides role-based portals for administrators, teachers, students, parents, registration staff, finance staff, and general staff.

## 🌐 Live Deployment

The system has been deployed online and can be accessed through:

**Live Website:** https://uumis.com.my

> Note: Access to certain portals requires authorised login credentials.

---

## 📌 Project Overview

The UUMIS School Management System aims to reduce manual and fragmented school operations by providing a centralised digital platform. The system supports student management, teacher management, attendance tracking, grading, assignment management, finance management, parent monitoring, food ordering, inventory management, notifications, reporting, and multi-language support.

This project was developed as part of the Final Year Project (FYP) for the Software Engineering programme at Universiti Utara Malaysia.

---

## ✨ Main Features

### Public Website

* Homepage and school information
* Admission information
* Online application form
* Calendar and contact page
* Multi-language support
* Access to academic portal login

### Admin Portal

* User and role management
* Student management
* Teacher and staff management
* Academic setup
* Reports and notifications
* School-wide dashboard overview

### Registration Staff Portal

* Student admission management
* Student registration records
* Student profile approval and updates

### Teacher Portal

* Teacher dashboard
* Lesson plan management
* Assignment and quiz management
* Attendance management
* Student grading and performance tracking

### Student Portal

* Student dashboard
* Student profile
* Assignment viewing and submission
* Attendance record viewing
* Grade viewing
* Food menu access

### Parent Portal

* Parent dashboard
* Child profile viewing
* Child attendance and grade monitoring
* Payment and wallet-related information
* School communication and notifications

### Finance Staff Portal

* Payment tracking
* Invoice and transaction records
* Refund management
* Discount and promotion management
* Wallet history

### General Staff Portal

* Inventory management
* Asset records
* Food order management
* Operational support functions

---

## 🚀 Tech Stack

| Area       | Technology                                   |
| ---------- | -------------------------------------------- |
| Frontend   | Angular, HTML, CSS, TypeScript, Tailwind CSS |
| Backend    | Spring Boot, Java, JPA / Hibernate           |
| Database   | MySQL                                        |
| Deployment | Online server, Docker, Docker Compose        |
| Web Server | Nginx                                        |
| Security   | Role-Based Access Control (RBAC)             |

---

## 🧩 System Architecture

The system follows a client-server architecture:

```text
User Browser
     ↓
Angular Frontend
     ↓
Spring Boot REST API
     ↓
MySQL Database
```

Users access the system through a web browser. The Angular frontend handles the user interface, while the Spring Boot backend manages business logic, authentication, role permissions, and communication with the MySQL database.

---

## 🔐 Role-Based Access Control

UUMIS uses Role-Based Access Control (RBAC) to ensure that each user can only access functions related to their role.

| Role               | Access Summary                                          |
| ------------------ | ------------------------------------------------------- |
| Admin              | Full system management access                           |
| Teacher            | Academic, attendance, assignment, and grading functions |
| Student            | Personal academic records and assignment access         |
| Parent             | Child monitoring, payment, and communication access     |
| Registration Staff | Admission and student registration management           |
| Finance Staff      | Payment, refund, discount, and wallet management        |
| General Staff      | Inventory, asset, and food order management             |

---

## 🛠️ Local Installation and Setup

Follow these steps to run the system locally using Docker.

### 1. Prerequisites

Make sure the following tools are installed:

* [Git](https://git-scm.com/)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 2. Clone the Repository

```bash
git clone https://github.com/NeohChiaLing/UUMIS.git
cd UUMIS
```

### 3. Run the System with Docker Compose

```bash
docker-compose up --build
```

The first build may take several minutes because Docker needs to download dependencies and build both the frontend and backend.

### 4. Access the Local Application

After the containers are running, open the system in your browser:

```text
Frontend: http://localhost:4200
Backend API: http://localhost:8080/api
```

The actual port may depend on the configuration in `docker-compose.yml`.

---

## 🔑 Demo Login Credentials

For security reasons, production credentials are not published in this README.

If demo accounts are required for project evaluation, please contact the project owner or supervisor for authorised access.

For local testing, demo accounts may be seeded in the database depending on the current backend configuration.

---

## ❗ Troubleshooting

### 1. Login Failed or Internal Server Error

This may happen if the local database has duplicate records or outdated data.

Try resetting the Docker volume:

```bash
docker-compose down -v
docker-compose up --build
```

### 2. Page Refresh Shows 404 Error

If refreshing a frontend route causes a 404 error, the Nginx configuration may not be handling Angular routes correctly.

Rebuild the frontend container:

```bash
docker-compose build frontend
docker-compose up
```

### 3. Backend Cannot Connect to MySQL

The backend may start before the MySQL database is fully ready.

Try stopping and restarting Docker:

```bash
docker-compose down
docker-compose up --build
```

---

## 📂 Project Structure

```text
UUMIS/
│
├── frontend/        # Angular frontend application
├── backend/         # Spring Boot backend application
├── docker-compose.yml
├── README.md
└── nginx.conf
```

The folder names may vary depending on the final project structure.

---

## 📌 Deployment Status

The system is currently deployed online at:

**https://uumis.com.my**

The online version is intended for demonstration, testing, and evaluation purposes.

---

## 👩‍💻 Developer

**Neoh Chia Ling**
Bachelor of Information Technology / Software Engineering
School of Computing
Universiti Utara Malaysia

---

## 📄 License

This project was developed for academic purposes as a Final Year Project. Reuse, modification, or redistribution should be done with proper permission from the project owner.
