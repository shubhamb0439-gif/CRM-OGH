# Healthcare CRM Application

A complete CRM web application for lead generation and management in the healthcare sector.

## Features

### Three Separate Accessible Links

1. **Admin Panel** - `/admin`
   - Default admin password: `admin123`
   - Access to dashboard, lead database, and booking management

2. **Assessment Submission** - `/assessment`
   - Healthcare efficiency assessment for doctors
   - Auto-generates leads based on assessment scores
   - Tracks efficiency levels (Good/Moderate/Needs Improvement)

3. **Consultancy Booking** - `/booking`
   - Book free consultation sessions
   - Creates leads and booking records automatically

## Admin Panel Sections

### Dashboard (`/admin/dashboard`)
- Real-time metrics:
  - Total Leads Generated
  - Qualified Leads
  - Closed Deals
  - Conversion Rate
- Lead source breakdown
- Efficiency level analytics

### Lead Database (`/admin/leads`)
- View all leads in a table format
- Filter by source (Assessment/Consultancy/Referral)
- Filter by status
- Search functionality
- Add manual referral leads
- Click "View" to see detailed lead profile

### Lead Profile (`/admin/leads/:id`)
- Complete lead information
- Update lead status:
  - New
  - Contacted
  - Qualified Prospect
  - Contract Sent
  - Confirmed Client
  - Closed
- Close leads as:
  - Confirmed Client
  - Not Interested
- View assessment scores and comments

### Booking Submissions (`/admin/bookings`)
- View all consultation bookings
- Update booking status:
  - Pending
  - Reviewed
  - Scheduled
  - Completed
- View detailed booking information

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **Database**: Supabase
- **Icons**: Lucide React

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Database Schema

### Tables

1. **leads**
   - Stores all lead information
   - Auto-populated from assessments and consultancy bookings
   - Supports manual referral entries

2. **consultancy_bookings**
   - Stores consultation booking details
   - Linked to leads table

3. **assessments**
   - Stores assessment submission data
   - Calculates efficiency levels based on score and time

## Default Login

- **Admin Password**: `admin123`

## Routes

- `/` - Home page with links to all three portals
- `/admin` - Admin login page
- `/assessment` - Assessment submission form (publicly accessible)
- `/booking` - Consultancy booking form (publicly accessible)
- `/admin/dashboard` - Admin dashboard (protected)
- `/admin/leads` - Lead database (protected)
- `/admin/leads/:id` - Individual lead profile (protected)
- `/admin/bookings` - Booking submissions (protected)

## Shareable Links

Share these direct links with users:

- **For Doctors/Healthcare Professionals**: `yourdomain.com/assessment`
- **For Consultation Bookings**: `yourdomain.com/booking`
- **For Admin Access**: `yourdomain.com/admin`

## Real-Time Updates

The application uses Supabase real-time subscriptions to automatically update:
- Dashboard metrics
- Lead database
- Booking submissions

All changes are reflected immediately across all admin users.
