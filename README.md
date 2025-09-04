# FCM Message Sender

**FCM Message Sender** is a modern and minimal web app for sending push notifications through Firebase Cloud Messaging (FCM). Designed for developers who need to test and send custom notifications to their Firebase projects. The web app is multilingual (English and Italian).

For more fileds and info consult 

https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages

![FCM Message Sender](https://img.shields.io/badge/Firebase-FCM-orange) ![Docker](https://img.shields.io/badge/Docker-Ready-blue) ![React](https://img.shields.io/badge/React-18-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## 🚀 Key Features

- **🔥 Multi-Project Management**: Upload and manage service certificates for multiple Firebase projects.
- **📱 Modern Interface**: Minimal and responsive design with Tailwind CSS and shadcn/ui.
- **⚡ Custom Messages**: Complete form to configure every aspect of the FCM message.
- **🔒 Security**: Certificates are securely managed by the local backend within the Docker environment.
- **💾 Persistence**: Certificates are automatically saved in the backend's `certs` directory.
- **🎯 Informative Tooltips**: Integrated guides for each form field.

## 🛠️ Technologies Used

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: Radix UI, Shadcn/UI, Lucide React Icons
- **Build Tool**: Vite
- **Containerization**: Docker & Docker Compose
- **State Management**: React Hooks + localStorage

## 🏃‍♂️ Quick Start

### With Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fcm-message-sender
   ```

2. **Start the application**
   ```bash
   # Development with hot-reload
   docker-compose -f docker-compose.dev.yml up --build

   # Production
   docker-compose up --build
   ```

3. **Access the app**
   - Development: [http://localhost:8080](http://localhost:8080)
   - Production: [http://localhost:9090](http://localhost:9090)

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

## 📋 How to Use the Application

### 1. Upload Firebase Certificates

1. **Get the service certificate**:
   - Go to the Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

2. **Add the certificate**:
   - Copy the entire content of the JSON file
   - Paste it into the "Paste JSON Certificate" text area
   - Click "Add Certificate"

3. **Manage certificates**:
   - View all uploaded certificates in the "Uploaded Certificates" section
   - Select a project by clicking "Select" or from the dropdown menu
   - Remove unnecessary certificates by clicking the trash icon 🗑️

### 2. Configure the FCM Message

The application offers a complete form with informative tooltips for each field:

#### **Basic Information**
- **Device Token**: Unique token of the recipient device
- **Title**: Notification title (max 100 characters recommended)
- **Body**: Message content (max 200 characters recommended)

#### **Media and Interactions**
- **Icon**: URL of the notification icon (PNG/JPEG format)
- **Image**: URL of the large image for rich notification (16:9 recommended)
- **Click Action**: URL or deep link for tap action

#### **Custom Data**
- Add key-value pairs for custom logic in the app
- Maximum 4KB of total data

#### **Android Configurations**
- **Sound**: `default`, `silent`, or audio file name
- **Color**: Icon color in hex format (#3B82F6)
- **Tag**: Group related notifications
- **Priority**: System priority control

#### **Web Push Configurations**
- **Require Interaction**: Prevents auto-dismiss
- **Vibration**: Vibration pattern in milliseconds (e.g., 200,100,200)

### 3. Send the Message

1. **Verify the configuration**:
   - Make sure you have selected an active project
   - Check that the device token is valid

2. **Send the notification**:
   - Click "Send FCM Message"
   - Wait for the sending confirmation

## 📱 How to Get the Device Token

### Web (JavaScript)
```javascript
import { getMessaging, getToken } from "firebase/messaging";

const messaging = getMessaging();
getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' }).then((currentToken) => {
  if (currentToken) {
    console.log('FCM Token:', currentToken);
  }
});
```

### Android (Kotlin)
```kotlin
FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
    if (!task.isSuccessful) return@addOnCompleteListener
    
    val token = task.result
    Log.d(TAG, "FCM Registration Token: $token")
}
```

### iOS (Swift)
```swift
Messaging.messaging().token { token, error in
    if let error = error {
        print("Error fetching token: \(error)")
    } else if let token = token {
        print("FCM token: \(token)")
    }
}
```

## 🔧 Docker Configuration

### File Structure
- **Dockerfile.prod**: Optimized multi-stage production build.
- **Dockerfile.dev**: Development container with hot-reload and volume mounting.
- **docker-compose.yml**: Orchestration file for the production environment.
- **docker-compose.dev.yml**: Orchestration file for the development environment.

### Starting with Docker Compose

**Development:**
To start the development environment with hot-reload, run:
```bash
docker-compose -f docker-compose.dev.yml up --build
```
The application will be accessible at [http://localhost:8080](http://localhost:8080).

**Production:**
To start the production environment, run:
```bash
docker-compose up --build
```
The application will be accessible at [http://localhost:9090](http://localhost:9090).

### Useful Docker Commands

```bash
# Manual build of the production image
docker build -t fcm-sender-prod -f Dockerfile.prod .

# Manual build of the development image
docker build -t fcm-sender-dev -f Dockerfile.dev .

# Direct execution of the production container
docker run -p 9090:8080 fcm-sender-prod

# Execution of the development container with volume
docker run -p 8080:8080 -v $(pwd):/app fcm-sender-dev

# Image cleanup
docker system prune -a
```

## 🔒 Security and Privacy

### ⚠️ Important Warnings
- **For Development/Testing Only**: This app is designed for developers.
- **Local Storage**: Certificates are saved in the browser's localStorage.
- **No Backend Server**: No data is sent to external servers.
- **Dedicated Certificates**: Use separate certificates for testing, never production ones.

### 🛡️ Best Practices
- Use dedicated Firebase projects for testing.
- Never share production certificates.
- Delete unused certificates.
- For production, implement a secure backend.

## 🎨 Design Customization

The app uses a modern and fully customizable design system:

### **Design Tokens**
- `src/index.css`: CSS variables and semantic design tokens.
- `tailwind.config.ts`: Extended Tailwind configuration.
- Fully customizable shadcn/ui components.


## 🐛 Troubleshooting

### **Common Errors**

| Problem | Cause | Solution |
|----------|-------|-----------|
| "Invalid certificate" | Malformed JSON or missing fields | Verify that it contains `project_id`, `private_key`, `client_email` |
| "Project already exists" | Duplicate certificate | Remove the existing certificate before adding a new one |
| Docker does not start | Ports occupied | Verify that ports 8080/9090 are free |
| "Message not sent" | Invalid token or certificate | Check the device token and project certificate |

### **Debug Steps**
1. Check the browser console for JavaScript errors
2. Check that the JSON certificate is complete and valid
3. Make sure the device token is active
4. Check the internet connection

### **Docker Logs**
```bash
# View container logs
docker-compose logs fcm-sender

# Follow logs in real time
docker-compose logs -f fcm-sender
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### **Development Guidelines**
- Follow existing design patterns
- Maintain TypeScript compatibility
- Add tests for new features
- Document public APIs

## 📞 Support and Community

- **🐛 Bug Reports**: Open an issue on GitHub
- **💡 Feature Requests**: Discuss in GitHub Discussions
- **❓ Questions**: Use GitHub Discussions
- **📧 Direct Contact**: [insert support email]

---

## 📄 License

This project is distributed under the **MIT License**. See the `LICENSE` file for full details.


<div align="center">

**FCM Message Sender** - *A tool for developers to test and send Firebase Cloud Messaging notifications*

Made with ❤️ by developers, for developers

[🚀 Get Started](#-quick-start) • [📖 Docs](#-how-to-use-the-application) • [🐳 Docker](#-docker-configuration) • [🤝 Contribute](#-contributing)

</div>

