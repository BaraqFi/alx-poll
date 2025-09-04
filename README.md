# PollVoter - Modern Polling Application

A modern polling application built with Next.js 15, Supabase, and Shadcn UI components.

## Features

- 🔐 User authentication with Supabase
- 📊 Create and manage polls
- 🗳️ Vote on polls (one vote per user per poll)
- 📱 Responsive design with modern UI
- 🔒 Row Level Security (RLS) for data protection
- ⚡ Real-time updates

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **UI Components**: Shadcn UI with Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+ 
- Supabase account
- Git

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd pollvoter
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase Database:
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Run the SQL commands from `database-schema.sql`

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses three main tables:

- **polls**: Stores poll information
- **poll_options**: Stores poll options
- **votes**: Stores user votes

All tables have Row Level Security (RLS) enabled for data protection.

## Project Structure

```
pollvoter/
├── app/
│   ├── (authentication)/    # Authentication pages
│   │   ├── login/
│   │   │   ├── login-form.tsx
│   │   │   └── page.tsx
│   │   └── register/
│   │       ├── register-form.tsx
│   │       └── page.tsx
│   ├── (main)/              # Main application pages
│   │   ├── dashboard.tsx
│   │   └── page.tsx
│   ├── polls/               # Poll management
│   │   ├── polls-list.tsx
│   │   ├── page.tsx
│   │   ├── create/
│   │   │   ├── create-poll.tsx
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       ├── poll-details.tsx
│   │       ├── page.tsx
│   │       └── edit/
│   │           ├── edit-poll.tsx
│   │           └── page.tsx
│   ├── layout.tsx           # Root layout with AuthProvider
│   └── globals.css          # Global styles
├── components/
│   ├── auth/               # Authentication components
│   │   └── auth-provider.tsx
│   ├── polls/              # Poll-related components
│   └── ui/                 # Shadcn UI components
├── lib/
│   ├── supabase/           # Supabase configurations
│   │   ├── browser-client.ts
│   │   ├── server-client.ts
│   │   └── auth-middleware.ts
│   ├── services/           # API services
│   │   └── poll-api.ts
│   ├── poll-types.ts       # TypeScript definitions
│   └── utils.ts            # Utility functions
├── middleware.ts           # Auth middleware
├── database-schema.sql     # Database schema
├── database-schema-fixed.sql # Fixed database schema
└── database-voting-policies-fix.sql # Voting policies fix
```

## Authentication Flow

1. Users register/login through the auth pages
2. Middleware protects routes and redirects unauthenticated users
3. AuthContext provides user state throughout the app
4. RLS policies ensure users can only access appropriate data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
