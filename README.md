# 📱 Steady

**Steady** is a cross-platform mood tracking application designed to help users monitor their emotional well-being through daily check-ins. Built with React Native and Expo, it works seamlessly on both mobile and web platforms.

## ✨ Features

### Core Functionality

-   📊 Intuitive mood tracking on a 0-10 scale
-   📝 Add notes to mood entries
-   📅 Chronological view of all entries
-   🎨 Color-coded mood visualization
-   🔍 Detailed view for individual entries

### Data Management

-   💾 Cross-platform data persistence
    -   SQLite for mobile
    -   IndexedDB for web
-   📤 Export data to JSON
-   📥 Import data from backup
-   🔄 Database management tools

### Settings & Notifications

-   ⏰ Configurable daily reminders
-   🕒 24-hour time picker
-   🔔 Smart notification handling
-   💾 Persistent preferences

### Platform Support

-   📱 Native mobile experience
-   🌐 Progressive web app
-   💫 Platform-specific optimizations

## 🛠 Tech Stack

| Layer            | Technology          | Purpose                      |
| ---------------- | ------------------- | ---------------------------- |
| Frontend         | React Native + Expo | Cross-platform UI framework  |
| Mobile Storage   | SQLite              | Mobile data persistence      |
| Web Storage      | IndexedDB           | Web data persistence         |
| Notifications    | Expo Notifications  | Cross-platform notifications |
| State Management | React Context       | App-wide state management    |
| Navigation       | React Navigation    | Screen navigation            |

## 📁 Project Structure

```
steady/
├── src/
│   ├── components/     # Reusable UI components
│   ├── screens/       # Main app screens
│   ├── data/         # Database and storage logic
│   ├── navigation/   # Navigation configuration
│   ├── types/        # TypeScript definitions
│   └── utils/        # Helper functions
├── assets/          # Images and static files
└── App.tsx         # Application entry point
```

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/yourusername/steady.git

# Navigate to project directory
cd steady

# Install dependencies
npm install

# Start the development server
npx expo start
```

## 📱 Platform Support

-   iOS: Tested and working
-   Android: Tested and working
-   Web: Tested and working with platform-specific optimizations

## 🔒 Privacy

-   All data is stored locally on your device
-   No account required
-   No data collection or tracking
-   Optional data export/import for backups

## 🚧 License

MIT License — feel free to use, modify, and contribute.

## 🌟 Author

**Haywood D. Johnson**

[GitHub](https://github.com/haywood-d-johnson) | [LinkedIn](https://www.linkedin.com/in/haywood-d-johnson/) | [Portfolio](https://www.hdjohnson-dev.online/)
