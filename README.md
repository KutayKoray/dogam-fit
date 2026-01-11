# 🍽️ Dogam.fit - AI-Powered Calorie & Macro Tracker

> **⚠️ Note:** This project was developed in 4-5 hours with Vibe Codin for personal needs. It serves as a functional MVP for calorie and macro tracking.

A modern, mobile-first web application for tracking calories and macronutrients with AI-powered food recognition and personalized nutrition goals.

🌐 **Live Demo:** [https://dogam.fit](https://dogam.fit)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black.svg)

## ✨ Features

### 🤖 AI-Powered Food Recognition
- Upload food photos and get instant calorie and macro estimates
- Powered by OpenAI GPT-4 Vision
- Accurate nutritional analysis

### 📊 Comprehensive Tracking
- Track calories, protein, carbs, and fat
- Daily, weekly, and monthly analytics
- Visual progress charts with goal indicators
- Meal history with edit capabilities

### 👤 Personalized Goals
- BMI calculator
- Custom daily calorie and macro targets
- Based on age, weight, height, activity level, and goals
- Mifflin-St Jeor equation for accurate BMR calculation

### 📱 Mobile-First Design
- Fully responsive UI optimized for mobile devices
- Touch-friendly controls
- Bottom sheet modals
- Hamburger navigation menu

### 🔐 Secure Authentication
- JWT-based authentication
- Bcrypt password hashing
- Protected API routes

## 🚀 Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React
- **Charts:** Recharts
- **Date Handling:** date-fns

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js 5
- **Database:** SQLite (Prisma ORM)
- **Authentication:** JWT + bcrypt
- **File Upload:** Multer
- **AI Integration:** OpenAI API

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/dogam-fit.git
cd dogam-fit
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Database Configuration
DATABASE_URL="file:./dev.db"

# Application Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
```

4. **Initialize the database**
```bash
npm run setup
```

5. **Start development servers**

Terminal 1 (Backend):
```bash
npm run dev:server
```

Terminal 2 (Frontend):
```bash
npm run dev
```

6. **Open the application**
```
http://localhost:3000
```

## 🎯 Usage

### Getting Started

1. **Register an account** - Create your profile with email and password
2. **Set up your profile** - Enter your personal information (age, weight, height, activity level)
3. **Set your goals** - Choose weight loss, gain, or maintenance
4. **Start tracking** - Add meals by uploading photos or entering data manually
5. **Monitor progress** - View daily stats and analytics charts

### Adding Meals

1. Click "Add Meal" button
2. Select meal type (breakfast, lunch, dinner, snack)
3. Upload a food photo or enter nutrition data manually
4. AI will analyze the photo and provide estimates
5. Confirm or edit the nutritional values
6. Save the meal

### Viewing Analytics

- Click on any stat card (Calories, Protein, Carbs, Fat) to view detailed analytics
- Toggle between 7-day and 30-day views
- See average, highest, and goal comparisons
- Interactive charts with hover tooltips

## 🏗️ Project Structure

```
calorie-tracker/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── dashboard/          # Main dashboard page
│   │   ├── profile/            # User profile page
│   │   ├── add-meal/           # Add meal page
│   │   ├── login/              # Login page
│   │   └── register/           # Registration page
│   ├── components/             # Reusable components
│   └── lib/                    # Utilities and API client
├── server/
│   ├── index.js                # Express server
│   ├── routes/                 # API routes
│   │   ├── auth.js             # Authentication endpoints
│   │   ├── meals.js            # Meal CRUD endpoints
│   │   └── profile.js          # Profile endpoints
│   └── middleware/             # Custom middleware
│       └── auth.js             # JWT verification
├── prisma/
│   └── schema.prisma           # Database schema
├── public/                     # Static assets
└── uploads/                    # User uploaded images
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Meals
- `GET /api/meals` - Get all meals for authenticated user
- `POST /api/meals` - Create new meal (with image upload)
- `PUT /api/meals/:id` - Update meal
- `DELETE /api/meals/:id` - Delete meal

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

## 🚢 Deployment

For detailed deployment instructions to production (Vercel + Railway), see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Quick Deploy

**Frontend (Vercel):**
1. Connect GitHub repository to Vercel
2. Set `NEXT_PUBLIC_API_URL` environment variable
3. Deploy

**Backend (Railway):**
1. Connect GitHub repository to Railway
2. Set all required environment variables
3. Deploy

**Domain:**
- Configure DNS in Namecheap to point to Vercel

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- OpenAI for GPT-4 Vision API
- Next.js team for the amazing framework
- Vercel for hosting platform
- Railway for backend hosting

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for healthy living**
