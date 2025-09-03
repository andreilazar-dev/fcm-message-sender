# FCM Message Sender

**FCM Message Sender** è una webapp moderna e minimal per l'invio di notifiche push attraverso Firebase Cloud Messaging (FCM). Progettata per sviluppatori che necessitano di testare e inviare notifiche personalizzate ai propri progetti Firebase.

![FCM Message Sender](https://img.shields.io/badge/Firebase-FCM-orange) ![Docker](https://img.shields.io/badge/Docker-Ready-blue) ![React](https://img.shields.io/badge/React-18-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## 🚀 Caratteristiche Principali

- **🔥 Gestione Multi-Progetto**: Carica e gestisci certificati di servizio per multipli progetti Firebase
- **📱 Interface Moderna**: Design minimal e responsive con Tailwind CSS e shadcn/ui
- **⚡ Messaggi Personalizzati**: Form completo per configurare ogni aspetto del messaggio FCM
- **🔒 Sicurezza**: Gestione locale dei certificati senza invio a server esterni
- **🐳 Docker Ready**: Configurazione completa per sviluppo e produzione con Docker
- **💾 Persistenza**: Salvataggio automatico dei certificati nel localStorage
- **🎯 Tooltip Informativi**: Guide integrate per ogni campo del form

## 🛠️ Tecnologie Utilizzate

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: Radix UI, Shadcn/UI, Lucide React Icons
- **Build Tool**: Vite
- **Containerization**: Docker & Docker Compose
- **State Management**: React Hooks + localStorage

## 🏃‍♂️ Avvio Rapido

### Con Docker (Raccomandato)

1. **Clona il repository**
   ```bash
   git clone <repository-url>
   cd fcm-message-sender
   ```

2. **Avvia l'applicazione**
   ```bash
   # Sviluppo con hot-reload
   docker-compose -f docker-compose.dev.yml up --build

   # Produzione
   docker-compose up --build
   ```

3. **Accedi all'app**
   - Sviluppo: [http://localhost:8080](http://localhost:8080)
   - Produzione: [http://localhost:9090](http://localhost:9090)

### Sviluppo Locale

1. **Installa le dipendenze**
   ```bash
   npm install
   # oppure
   bun install
   ```

2. **Avvia il server di sviluppo**
   ```bash
   npm run dev
   # oppure
   bun dev
   ```

## 📋 Come Utilizzare l'Applicazione

### 1. Carica i Certificati Firebase

1. **Ottieni il certificato di servizio**:
   - Vai nella Console Firebase → Impostazioni Progetto → Account di servizio
   - Clicca "Genera nuova chiave privata"
   - Scarica il file JSON

2. **Aggiungi il certificato**:
   - Copia l'intero contenuto del file JSON
   - Incollalo nell'area di testo "Incolla JSON Certificato"
   - Clicca "Aggiungi Certificato"

3. **Gestisci i certificati**:
   - Visualizza tutti i certificati caricati nella sezione "Certificati Caricati"
   - Seleziona un progetto cliccando "Seleziona" o dal menu dropdown
   - Rimuovi certificati non necessari cliccando l'icona cestino 🗑️

### 2. Configura il Messaggio FCM

L'applicazione offre un form completo con tooltip informativi per ogni campo:

#### **Informazioni Base**
- **Device Token**: Token unico del dispositivo destinatario
- **Titolo**: Titolo della notifica (max 100 caratteri consigliati)
- **Corpo**: Contenuto del messaggio (max 200 caratteri consigliati)

#### **Media e Interazioni**
- **Icona**: URL dell'icona della notifica (formato PNG/JPEG)
- **Immagine**: URL immagine grande per notifica rich (16:9 consigliato)
- **Click Action**: URL o deep link per azione al tap

#### **Dati Personalizzati**
- Aggiungi coppie chiave-valore per logica custom nell'app
- Massimo 4KB di dati totali

#### **Configurazioni Android**
- **Suono**: `default`, `silent`, o nome file audio
- **Colore**: Colore dell'icona in formato hex (#3B82F6)
- **Tag**: Raggruppa notifiche correlate
- **Priorità**: Controllo priorità di sistema

#### **Configurazioni Web Push**
- **Richiedi Interazione**: Impedisce auto-dismiss
- **Vibrazione**: Pattern vibrazione in millisecondi (es: 200,100,200)

### 3. Invia il Messaggio

1. **Verifica la configurazione**:
   - Assicurati di aver selezionato un progetto attivo
   - Controlla che il device token sia valido

2. **Invia la notifica**:
   - Clicca "Invia Messaggio FCM"
   - Attendi la conferma dell'invio

## 📱 Come Ottenere il Device Token

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

## 🔧 Configurazione Docker

### Struttura Files
- **Dockerfile**: Build di produzione multi-stage ottimizzato
- **Dockerfile.dev**: Container per sviluppo con hot-reload e volume mounting
- **docker-compose.yml**: Orchestrazione per entrambi gli ambienti

### Comandi Docker Utili

```bash
# Build manuale dell'immagine
docker build -t fcm-message-sender .

# Esecuzione diretta container produzione
docker run -p 4173:4173 fcm-message-sender

# Esecuzione container sviluppo con volume
docker run -p 3000:3000 -v $(pwd):/app fcm-message-sender:dev

# Cleanup immagini
docker system prune -a
```

## 🔒 Sicurezza e Privacy

### ⚠️ Avvertenze Importanti
- **Solo per Sviluppo/Testing**: Questa app è progettata per sviluppatori
- **Storage Locale**: I certificati vengono salvati nel localStorage del browser
- **Nessun Server Backend**: Nessun dato viene inviato a server esterni
- **Certificati Dedicati**: Usa certificati separati per testing, mai quelli di produzione

### 🛡️ Best Practices
- Usa progetti Firebase dedicati per testing
- Non condividere mai certificati di produzione
- Elimina certificati non utilizzati
- Per produzione, implementa un backend sicuro

## 🎨 Personalizzazione Design

L'app utilizza un design system moderno e completamente personalizzabile:

### **Design Tokens**
- `src/index.css`: Variabili CSS e token di design semantici
- `tailwind.config.ts`: Configurazione Tailwind estesa
- Componenti shadcn/ui completamente personalizzabili

### **Colori e Temi**
```css
:root {
  --primary: 221.2 83.2% 53.3%;        /* Blu principale */
  --primary-foreground: 210 40% 98%;    /* Testo su primary */
  --secondary: 210 40% 96%;             /* Grigio chiaro */
  --muted: 210 40% 94%;                 /* Sfondo muted */
  --accent: 210 40% 92%;                /* Accenti */
  /* ... altri token */
}
```

## 📚 Struttura del Progetto

```
fcm-message-sender/
├── 📁 src/
│   ├── 📁 components/
│   │   ├── 📄 CertificateManager.tsx    # 🔧 Gestione certificati Firebase
│   │   ├── 📄 FCMMessageForm.tsx        # 📝 Form configurazione messaggio
│   │   └── 📁 ui/                       # 🎨 Componenti UI base (shadcn)
│   ├── 📁 pages/
│   │   └── 📄 Index.tsx                 # 🏠 Pagina principale
│   ├── 📁 hooks/                        # 🔗 React hooks personalizzati
│   ├── 📁 lib/                         # 🛠️ Utilities e helpers
│   └── 📄 index.css                     # 🎨 Design system e tokens
├── 📁 public/                           # 🌐 Assets statici
├── 📄 Dockerfile                        # 🐳 Container produzione
├── 📄 Dockerfile.dev                    # 🐳 Container sviluppo
├── 📄 docker-compose.yml                # 🐳 Orchestrazione
└── 📄 package.json                      # 📦 Dipendenze NPM
```

## 🐛 Risoluzione Problemi

### **Errori Comuni**

| Problema | Causa | Soluzione |
|----------|-------|-----------|
| "Certificato non valido" | JSON malformato o campi mancanti | Verifica che contenga `project_id`, `private_key`, `client_email` |
| "Progetto già esistente" | Certificato duplicato | Rimuovi il certificato esistente prima di aggiungerne uno nuovo |
| Docker non avvia | Porte occupate | Verifica che le porte 3000/4173 siano libere |
| "Messaggio non inviato" | Token o certificato invalido | Controlla token dispositivo e certificato progetto |

### **Debug Steps**
1. Verifica la console del browser per errori JavaScript
2. Controlla che il certificato JSON sia completo e valido
3. Assicurati che il token del dispositivo sia attivo
4. Verifica la connessione internet

### **Logs Docker**
```bash
# Visualizza logs del container
docker-compose logs fcm-sender

# Segui logs in tempo reale
docker-compose logs -f fcm-sender
```

## 🔄 Roadmap Future

- [ ] **Backend API**: Endpoint sicuro per gestione certificati
- [ ] **Batch Messaging**: Invio a multipli dispositivi
- [ ] **Template System**: Salvataggio template messaggi
- [ ] **Analytics**: Statistiche invii e delivery
- [ ] **Import/Export**: Backup configurazioni
- [ ] **Tema Dark/Light**: Switch tema utente

## 🤝 Contribuire

1. **Fork** il repository
2. **Crea** un branch feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** le modifiche (`git commit -m 'Add some AmazingFeature'`)
4. **Push** al branch (`git push origin feature/AmazingFeature`)
5. **Apri** una Pull Request

### **Linee Guida Sviluppo**
- Segui i pattern esistenti di design
- Mantieni la compatibilità TypeScript
- Aggiungi test per nuove funzionalità
- Documenta le API pubbliche

## 📄 Licenza

Questo progetto è distribuito sotto **Licenza MIT**. Vedi il file `LICENSE` per i dettagli completi.

## 📞 Supporto e Community

- **🐛 Bug Reports**: Apri una issue su GitHub
- **💡 Feature Requests**: Discuti nelle GitHub Discussions
- **❓ Domande**: Usa le GitHub Discussions
- **📧 Contatto Diretto**: [inserire email di supporto]

---

<div align="center">

**FCM Message Sender** - *Strumento per sviluppatori per testare e inviare notifiche Firebase Cloud Messaging*

Made with ❤️ by developers, for developers

[🚀 Get Started](#-avvio-rapido) • [📖 Docs](#-come-utilizzare-lapplicazione) • [🐳 Docker](#-configurazione-docker) • [🤝 Contribute](#-contribuire)

</div>