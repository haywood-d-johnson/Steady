# 📱 Steady

**Steady** is a simple, personal mood-tracking app designed for daily check-ins using a 0–10 scale, specifically helpful for tracking patterns and managing mood

---

## 🚀Features

-   Daily customizable notification (default 9PM)
-   Mood tracking on a 0–10 scale (0 = crisis, 5 = okay, 10 = mania)
-   On-demand average calculation (above/below 5, overall)
-   Calendar to view and edit daily entries and reflections
-   Works offline with no user account required

---

## 📊Tech Stack

| Layer         | Language           | Notes                                                    |
| ------------- | ------------------ | -------------------------------------------------------- |
| Mobile App    | TypeScript         | Built with React Native + Expo                           |
| Storage       | AsyncStorage       | Local, persistent data (moods, notes, notification time) |
| Notifications | Expo Notifications | Cross-platform push reminder support                     |

---

## 📁Project Structure

```steady-app/
├── src/
│   ├── components/ # UI components like MoodSlider, AverageCard
│   ├── screens/ # Home, Calendar, Settings
│   ├── utils/ # average calculation, helpers
│   ├── services/ # storage and notification logic
│   ├── App.tsx # Entry point
│   ├── assets/ # Icons, images
│   ├── app.json # Expo config
│   └── README.md
```

---

## 🔧 Setup Instructions

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/steady.git
cd steady
# 2. Install dependencies
npm install
# 3. Start the project
npx expo start
```

---

## 🚧 License

MIT License — feel free to use, modify, and contribute.

## 🌟 Author

**Haywood D. Johnson**

[GitHub](https://github.com/haywood-d-johnson) | [LinkedIn](https://www.linkedin.com/in/haywood-d-johnson/) |
