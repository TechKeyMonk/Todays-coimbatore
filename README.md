# TodaysCoimbatore

A modern, high-performance local news and city portal for Coimbatore. Built with Next.js, React, and Supabase.

## 🚀 Features

- **Dynamic News Feed**: Real-time news updates across multiple categories (Top Stories, Business, Tech, Infrastructure).
- **Native Ad Banner Engine**: Fully customizable programmatic and native ad placements. Includes dynamic sliding banners (Header, Sidebars, In-feed) with a robust showcase-only presentation layer.
- **Admin CMS Dashboard**: Built-in, secure content management system for managing:
  - Ad Slots & Placements (with direct Supabase Storage cloud uploads for image creatives)
  - Articles & Directory Listings
  - TANGEDCO power outage red-alerts
  - Blood Donor Enquiries
- **Interactive Widgets**: Live updates for local Weather, Traffic, and Bullion (Gold/Silver) rates.
- **Accessibility & Media**: In-app AI-powered audio readers (Text-to-Speech) and native video integrations.
- **Automated Workflows**: Cron jobs for scraping, content aggregation, and regular cleanups configured for scalable Vercel deployments.

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL + Storage)
- **Deployment**: [Vercel](https://vercel.com/)

## ⚙️ Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/TechKeyMonk/Todayscoimbatore.git
   cd todayscoimbatore
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Copy `.env.example` to `.env.local` and configure your API keys (Supabase, Gemini, Gmail, etc).
   ```bash
   cp .env.example .env.local
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Repository Structure

- `/src/app` - Next.js App Router endpoints and primary pages.
- `/src/components` - Reusable UI components and widgets.
- `/src/services` - Database adapters, Supabase clients, and logic handlers.
- `/src/app/admin` - Private dashboard for CMS management.

## 📜 License

© 2026 TodaysCoimbatore. All Rights Reserved.
