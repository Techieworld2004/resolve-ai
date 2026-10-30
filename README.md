# 🚀 ResolveAI - AI-Powered Customer Support & Ticketing System

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/Techieworld2004/resolve-ai)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Groq Cloud](https://img.shields.io/badge/Groq-Ultra--Fast_LLM-f55036?logo=fastapi)](https://groq.com/)

ResolveAI is an intelligent, full-stack customer support and ticketing platform. It provides seamless ticket management, threaded customer-agent messaging, role-based workflows, and an autonomous AI support assistant powered by Groq / LLMs to automatically resolve customer inquiries and assist support agents with suggested replies.


---

## 🔑 Demo Test Accounts

The backend automatically seeds these test credentials on startup for instant testing:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@resolveai.com` | `admin123` | Full system access, view/manage all tickets & users |
| **Support Agent** | `agent@resolveai.com` | `agent123` | Ticket assignment, agent replies, AI suggestion tools |
| **Customer** | `customer@resolveai.com` | `customer123` | Create tickets, view ticket status, chat with AI |

> 💡 **Tip**: On the login page, you can click the quick-fill pills (Admin, Agent, Customer) for 1-click test login!

---

## ✨ Key Features

- **🎫 Comprehensive Ticket Management**:
  - Full CRUD operations on tickets with priorities (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) and statuses (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`).
  - Search, filter by status, and assign tickets to support agents.

- **💬 Threaded Real-Time Conversations**:
  - Customer and agent messaging threads linked to each ticket.
  - Visual distinction between customer messages, agent responses, and AI assistant replies.

- **🤖 Autonomous AI Support Assistant**:
  - Embedded floating **AIChatWidget** on frontend with customizable LLM engine.
  - Pre-integrated with **Groq Cloud** (`llama-3.3-70b-versatile`, `openai/gpt-oss-120b`), **Gemini**, and **OpenAI**.
  - Built-in fallback AI response engine when external API keys are not supplied.
  - **AI Ticket Assist**: Automatically generates contextual suggestions and auto-replies for open tickets based on conversation history.

- **🔐 Role-Based Access & Security**:
  - BCrypt password hashing for user accounts.
  - Distinct views and actions for Customers, Support Agents, and Administrators.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 (Vite)
- **Routing**: React Router DOM
- **HTTP Client**: Axios with logging interceptors
- **Styling**: Modern Vanilla CSS (Glassmorphism, dark/light balanced theme, responsive design)
- **Icons**: SVG icon sets

### Backend
- **Framework**: Java 17+, Spring Boot 3.x
- **Data Persistence**: Spring Data JPA / Hibernate
- **Database**: MySQL 8.0 (with H2 in-memory option for unit testing)
- **HTTP & AI Client**: Java 11 `HttpClient` + Jackson `ObjectMapper`
- **Build Tool**: Maven Wrapper (`./mvnw`)

---

## 📦 Project Structure

```plaintext
resolve-ai/
├── backend/
│   ├── src/main/java/com/resolveai/backend/
│   │   ├── config/              # SecurityConfig, WebConfig, Exception Handlers
│   │   ├── controller/          # REST Controllers (Ai, Ticket, User, Message)
│   │   ├── entity/              # JPA Entities (User, Ticket, Message)
│   │   ├── repository/          # Spring Data JPA Repositories
│   │   └── service/             # Business Logic & LLM Integration Services
│   ├── src/main/resources/
│   │   └── application.properties # Server port 8081, DB configs, LLM endpoints
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── components/          # AIChatWidget, Navbar, UI Components
│   │   ├── pages/               # HomePage, LoginPage, RegisterPage, TicketListPage, CreateTicketPage
│   │   ├── api.js               # Centralized Axios API client
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── postman/
│   └── ResolveAI_Postman_Collection.json # Complete API collection
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Java**: JDK 17 or higher
- **Node.js**: v18 or higher (with `npm`)
- **MySQL**: Running on port `3306` with database `resolveai_db` (or allow `createDatabaseIfNotExist=true`)

---

### 2. Backend Setup

1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```

2. Configure your MySQL credentials in `src/main/resources/application.properties` (or set environment variables):
   ```properties
   spring.datasource.username=root
   spring.datasource.password=YOUR_MYSQL_PASSWORD
   ```

3. *(Optional)* Provide your Groq API Key for AI features (can also be entered dynamically in the UI):
   ```properties
   resolveai.llm.groq-api-key=YOUR_GROQ_API_KEY
   ```
   *Alternatively, export `GROQ_API_KEY=your_key` in your environment.*

4. Run the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
   ```
   *(On Windows Command Prompt or PowerShell: `.\mvnw.cmd spring-boot:run`)*

5. The backend will be available at:
   - **Base API URL**: `http://localhost:8081/api`
   - **Health/AI Status**: `http://localhost:8081/api/ai/config`

---

### 3. Frontend Setup

1. Open a new terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   - **Localhost**: `http://localhost:5173` or `http://127.0.0.1:5173`
   - **Local Network (Wi-Fi)**: `http://192.168.1.66:5173` *(access from other devices on your LAN)*

---

## 🌐 Localhost & Network IP Addresses

| Component | Host / IP Address | URL | Description |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | `localhost` | [http://localhost:5173](http://localhost:5173) | Primary in-browser client |
| **Frontend Web App** | `127.0.0.1` | [http://127.0.0.1:5173](http://127.0.0.1:5173) | IPv4 Loopback |
| **Frontend (LAN / Wi-Fi)** | `192.168.1.66` | [http://192.168.1.66:5173](http://192.168.1.66:5173) | Mobile phones, tablets, or other PCs |
| **Frontend (WSL Switch)** | `172.23.128.1` | [http://172.23.128.1:5173](http://172.23.128.1:5173) | Windows Subsystem for Linux / Hyper-V |
| **Backend REST API** | `localhost:8081` | [http://localhost:8081/api](http://localhost:8081/api) | Spring Boot REST endpoints |
| **Backend REST API (LAN)** | `192.168.1.66:8081` | [http://192.168.1.66:8081/api](http://192.168.1.66:8081/api) | Direct API calls across local network |

> 📱 **Network Access**: Vite has `server.host: true` enabled and backend CORS allows `*` origin patterns, allowing any device connected to your local Wi-Fi to load the UI at `http://192.168.1.66:5173`.

---

## 📡 REST API Reference

### 🔐 Authentication & Users (`/api/users`)
- `POST /api/users/register` - Register a new customer/agent account
- `POST /api/users/login` - Authenticate and retrieve user profile
- `GET /api/users` - List all users (Admin)
- `GET /api/users/{id}` - Get user details by ID

### 🎫 Tickets (`/api/tickets`)
- `POST /api/tickets` - Create a new support ticket
- `GET /api/tickets` - Retrieve all tickets (supports `?status=OPEN` filter)
- `GET /api/tickets/{id}` - Retrieve ticket details
- `GET /api/tickets/user/{userId}` - Get tickets submitted by a specific user
- `GET /api/tickets/agent/{agentId}` - Get tickets assigned to an agent
- `PATCH /api/tickets/{id}/status` - Update ticket status (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`)
- `DELETE /api/tickets/{id}` - Delete a ticket

### 💬 Messages (`/api/messages`)
- `POST /api/messages` - Send a message in a ticket thread
- `GET /api/messages/ticket/{ticketId}` - Get all chronological messages for a ticket

### 🤖 AI Assistant (`/api/ai`)
- `GET /api/ai/config` - Get AI service status and active provider
- `POST /api/ai/chat` - Direct interactive conversation with support bot
- `GET /api/ai/suggest-reply/{ticketId}` - Generate an AI-recommended response for an agent
- `POST /api/ai/ticket-assist/{ticketId}` - Auto-generate and append an AI assistant response to the ticket thread

---

## 🧪 Testing with Postman

1. Open **Postman**.
2. Click **Import** (top left).
3. Select the file: `postman/ResolveAI_Postman_Collection.json`.
4. The environment variable `{{baseUrl}}` defaults to `http://localhost:8081/api`.
5. Run the requests in sequential order to test Auth, Ticket Creation, Messaging, and AI Auto-Assist.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
