This is a professional and detailed `README.md` script tailored for your **UUMIS** project. It guides users (like your lecturer) through the cloning process, the Docker setup, and the specific troubleshooting steps we solved today.

Copy the code block below and paste it directly into your GitHub README.

---

```markdown
# UUMIS - School Management System

UUMIS is a full-stack web application designed for school management, featuring dedicated portals for **Students**, **Staff**, and **Administrators**. The system handles academic records, attendance, and financial management with role-based access control.

## 🚀 Tech Stack
* **Frontend:** Angular (Standalone Components, Tailwind CSS)
* **Backend:** Spring Boot 3+ (Java 17, JPA/Hibernate)
* **Database:** MySQL 8.0
* **Deployment:** Docker & Docker Compose
* **Web Server:** Nginx (Alpine-based)

---

## 🛠️ Installation & Setup

Follow these steps to run the entire system on your local machine using Docker.

### 1. Prerequisites
Ensure you have the following installed:
* [Git](https://git-scm.com/)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Make sure it is running)

### 2. Clone the Repository
Open your terminal/command prompt and run:
```bash
git clone [https://github.com/NeohChiaLing/UUMIS.git](https://github.com/NeohChiaLing/UUMIS.git)
cd UUMIS

```

### 3. Run with Docker Compose

From the root project folder, run:

```bash
docker-compose up --build

```

*Note: The first build might take a few minutes as it downloads dependencies and compiles the Java/Angular code.*

### 4. Access the Application

Once the terminal shows the Spring Boot logo and Nginx starts, open your browser:

* **Frontend:** [http://localhost:4200](https://www.google.com/search?q=http://localhost:4200)
* **Backend API:** [http://localhost:8080/api](https://www.google.com/search?q=http://localhost:8080/api)

---

## 🔐 Default Login Credentials

The system automatically seeds the database with the following accounts for testing:

| Role | Email | Password |
| --- | --- | --- |
| **System Admin** | `admin@uumis.edu.my` | `123` |
| **Staff Manager** | `staff@uumis.edu.my` | `123` |
| **Register Manager** | `register@uumis.edu.my` | `123` |
| **Financial Manager** | `finance@uumis.edu.my` | `123` |
| **Student** | `student@uumis.edu.my` | `123` |
| **Parent** | `parent@uumis.edu.my` | `123` |

---

## ❗ Troubleshooting & Common Errors

### 1. Login Failed: "Undefined" or "Internal Server Error"

This usually happens due to duplicate records or database synchronization issues during the first setup.
**Fix:** Reset the Docker volumes to start with a clean database:

```bash
docker-compose down -v
docker-compose up --build

```

### 2. 404 Not Found on Page Refresh

If you refresh the browser (F5) and see an Nginx 404 error, the `nginx.conf` was likely not picked up.
**Fix:** Ensure the `nginx.conf` file is in the frontend folder and rebuild:

```bash
docker-compose build frontend
docker-compose up

```

### 3. Connection Refused (Backend failing to find Database)

The backend might start faster than the MySQL database.
**Fix:** We have implemented a `healthcheck` in `docker-compose.yml`. If it still fails, simply stop Docker (`Ctrl+C`) and run `docker-compose up` again.

---

## 👥 Role-Based Access Control (RBAC)

* **Financial Manager:** Access to Payment, Refund, Discount, and Wallet tools. **Students Management is hidden.**
* **Register Manager:** Access to Student Profiles and Enrollment. **Financial tools are hidden.**
* **General Staff/Admin:** Full access to all management modules.

```

---

### How to add this to your GitHub:
1.  Go to your repository: [https://github.com/NeohChiaLing/UUMIS](https://github.com/NeohChiaLing/UUMIS).
2.  Click the green **"Add a README"** button (or click **"Add file"** -> **"Create new file"** and name it `README.md`).
3.  Paste the code above.
4.  Scroll down and click **"Commit changes"**.

**Your GitHub page will now look professional and be easy for your lecturer to run! Is there anything else you'd like to add to it?**

```
