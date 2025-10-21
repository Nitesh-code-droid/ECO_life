# EcoLife - Gamified Sustainable Living Platform

A production-grade hackathon MVP that gamifies eco-friendly habits and responsible shopping through a reward-based platform.

## 🌟 Features

- **🔐 Authentication**: Firebase Auth with Google OAuth (Demo mode available)
- **🎮 Gamification**: Green Credits system, badges, and leaderboards
- **📊 Habit Tracking**: Log eco-friendly actions with instant feedback
- **🌍 Carbon Analysis**: Product carbon footprint analyzer with alternatives
- **🏆 Rewards System**: Redeem credits for eco-friendly rewards
- **✨ Tubelight Navbar**: Signature glowing navigation with smooth animations
- **📱 Mobile Responsive**: Optimized for all devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

The app will be available at `http://localhost:5173`

### Demo Mode

The app runs in **demo mode** by default, which means:
- ✅ No real Firebase setup required
- ✅ Click "Try Demo Now" to experience all features
- ✅ Sample data preloaded for instant testing
- ✅ All animations and interactions work perfectly

## 🎯 Demo Flow

1. **Login** → Click "Try Demo Now" (no real auth needed)
2. **Log Habit** → Use quick action buttons to earn Green Credits
3. **Scan Product** → Enter product names to see carbon footprint
4. **View Rewards** → Browse available eco-friendly rewards
5. **Check Leaderboard** → See your ranking among eco-warriors

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + shadcn/ui components
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **Backend**: Firebase (Firestore + Auth)
- **Forms**: React Hook Form
- **Notifications**: Sonner

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── TubelightNavbar.tsx # Signature glowing navbar
│   ├── HabitLogger.tsx     # Habit tracking interface
│   ├── CarbonAnalyzer.tsx  # Product carbon footprint analyzer
│   └── RewardsSystem.tsx   # Gamified rewards and leaderboard
├── pages/
│   ├── Login.tsx           # Authentication page
│   └── Dashboard.tsx       # Main dashboard
├── lib/
│   └── firebase.js         # Firebase config and API functions
└── App.tsx                 # Main app component
```

## 🎨 Design System

### Color Palette
- **Primary**: Emerald gradients (#10B981 to #34D399)
- **Secondary**: Lime accents (#84CC16 to #A3E635)
- **Background**: Dark gradients with emerald highlights
- **Animations**: Glowing effects with neon green (#00FF88)

### Key Components
- **Tubelight Navbar**: Signature glowing navigation with smooth transitions
- **Habit Cards**: Interactive cards with instant credit feedback
- **Carbon Analyzer**: Real-time product impact visualization
- **Rewards Grid**: Gamified reward browsing and redemption

## 🌍 Environmental Impact

Track and visualize your environmental impact:
- **Green Credits**: Earn points for sustainable actions
- **CO₂ Savings**: See real carbon footprint reduction
- **Habit Streaks**: Build consistent eco-friendly routines
- **Community**: Compete with other eco-warriors

## 🏗 Production Setup

For production deployment with real Firebase:

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication and Firestore
3. Replace the demo config in `src/lib/firebase.js` with your real Firebase config
4. Set `isDemoMode = false` in the Firebase config
5. Deploy to Vercel, Netlify, or your preferred platform

## 📱 Mobile Experience

- **Responsive Design**: Optimized for mobile-first experience
- **Touch Interactions**: Smooth animations and haptic feedback
- **Progressive Web App**: Can be installed on mobile devices
- **Offline Support**: Basic functionality works offline

## 🎪 Hackathon Ready

This MVP is specifically designed for hackathon presentations:
- ⚡ **Fast Setup**: Works immediately without external dependencies
- 🎭 **Demo Mode**: Perfect for live presentations
- ✨ **Visual Appeal**: Stunning animations and "Tesla meets Duolingo" aesthetic
- 📊 **Data Visualization**: Interactive charts and progress tracking
- 🏆 **Gamification**: Engaging reward system and competitions

## 🔧 Available Scripts

```bash
# Development
pnpm run dev          # Start dev server
pnpm run build        # Build for production
pnpm run preview      # Preview production build
pnpm run lint         # Run ESLint

# Testing
pnpm run type-check   # TypeScript type checking
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌱 About EcoLife

EcoLife transforms sustainable living into an exciting game where every eco-friendly action counts. Join thousands of users who are making a real difference for our planet, one habit at a time.

**Every Click Saves the Planet 🌍**

---

Made with 💚 for a sustainable future