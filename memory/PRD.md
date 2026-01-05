# Village Friends - Product Requirements Document

## Original Problem Statement
Build an app where homeschool parents can find other homeschool families in the same geographical area and arrange meeting dates so their kids can be friends and socialize. Add a safety feature. The families get a free trial then pay in whatever way works best for profit. Name it Village Friends and have the brand colors be muted and earthy tones of green, teal/blue, and coral.

## User Choices
- **Safety Features**: ID verification + email verification
- **Payment Model**: Free 14-day trial → Monthly ($9.99) or Annual ($89.99) subscription via Stripe
- **Location Discovery**: Zip code/radius search, city/neighborhood, map-based - all options
- **Authentication**: Both JWT email/password AND Google OAuth (Emergent Auth)
- **Features**: Calendar scheduling, event posting/creation/signup, chat messaging, meetup confirmation

---

## User Personas

### Primary: Sarah, Homeschool Mom
- **Age**: 35-45
- **Needs**: Find socialization opportunities for her kids, connect with like-minded families
- **Pain Points**: Isolation, difficulty finding homeschool groups in her area
- **Goals**: Regular playdates, field trips, co-op activities

### Secondary: Mark, Homeschool Dad
- **Age**: 38-48
- **Needs**: Coordinate with other dads for sports activities, outdoor adventures
- **Goals**: Find families with kids of similar ages for activities

---

## Core Requirements (Static)

### Authentication & Safety
- [x] Email/password registration with JWT tokens
- [x] Google OAuth via Emergent Auth
- [x] Email verification status tracking
- [x] ID verification request system
- [x] 14-day free trial on registration

### Family Profiles
- [x] Family name, bio, profile picture
- [x] Location (city, state, ZIP, coordinates)
- [x] Children info (name, age, interests)
- [x] Family interests
- [x] Search radius preference

### Discovery & Connection
- [x] Location-based family search (ZIP code radius)
- [x] City/neighborhood filtering
- [x] Map view with markers (Leaflet)
- [x] List view with distance calculation
- [x] Interest-based filtering

### Events & Meetups
- [x] Event creation (meetup, playdate, field trip, co-op, workshop, sports)
- [x] Event details (date, time, location, max attendees, age range)
- [x] RSVP system
- [x] Attendee list
- [x] Host identification

### Messaging
- [x] Direct messages between families
- [x] Conversation list with last message preview
- [x] Unread message indicators
- [x] Chat interface

### Meetup Requests
- [x] Send meetup request to specific family
- [x] Propose date, time, location
- [x] Accept/decline workflow
- [x] Auto-create event on acceptance

### Calendar
- [x] Monthly calendar view
- [x] View events you're hosting or attending
- [x] Event type color coding

### Subscription
- [x] Stripe checkout integration
- [x] Monthly plan ($9.99)
- [x] Annual plan ($89.99)
- [x] Trial status tracking
- [x] Subscription success handling

---

## What's Been Implemented

### December 2024 - MVP Release

**Backend (FastAPI + MongoDB)**
- User authentication (JWT + Google OAuth)
- Family profile CRUD
- Location-based family discovery with Haversine distance calculation
- Events system with RSVP
- Messaging between families
- Meetup request workflow
- Calendar events API
- Stripe subscription checkout
- ID verification request endpoint

**Frontend (React + Tailwind)**
- Landing page with value proposition and pricing
- Auth pages (Login, Register, Google OAuth callback)
- Dashboard with nearby families and upcoming events
- Onboarding flow for family profile creation
- Discover page with list and map views
- Events listing and detail pages
- Event creation form
- Messages/chat interface
- Calendar view
- Profile and Settings pages
- Pricing page with Stripe integration
- Subscription success page

**Design**
- Brand colors: Teal (#2A9D8F), Forest (#264653), Coral (#E76F51), Warm Sand (#F4F1DE)
- Font: Fraunces (headings) + Nunito (body)
- Responsive layout with mobile sidebar
- Card-based UI with hover effects
- Leaflet map integration

---

## Prioritized Backlog

### P0 (Critical) - Completed ✅
- [x] User registration & login
- [x] Family profile creation
- [x] Family discovery
- [x] Event creation & RSVP
- [x] Messaging
- [x] Stripe subscription

### P1 (High Priority) - Completed ✅
- [x] Co-op & Group Management (Premium feature)
- [x] Create groups (co-ops, support groups, activity clubs)
- [x] Join/leave groups
- [x] Post announcements
- [x] Group events
- [x] Muted color palette update

### P2 (High Priority) - Future
- [ ] Real-time messaging (WebSocket)
- [ ] Push notifications for new messages/events
- [ ] Email notifications for meetup requests
- [ ] Profile photo upload
- [ ] Advanced search filters (age ranges, specific interests)

### P2 (Medium Priority) - Future
- [ ] Review/recommendation system
- [ ] Group/co-op management
- [ ] Recurring events
- [ ] Event reminders
- [ ] Export calendar to Google/iCal

### P3 (Nice to Have) - Future
- [ ] Mobile app (React Native)
- [ ] Video meetup integration
- [ ] Resource sharing (curriculum, activities)
- [ ] Local business partnerships
- [ ] Community forums

---

## Next Tasks

1. **Real-time Messaging**: Implement WebSocket for instant message delivery
2. **Email Notifications**: Send emails for meetup requests, event reminders
3. **Profile Photos**: Add image upload to family profiles
4. **Admin Dashboard**: Moderation tools for ID verification review
5. **Analytics**: Track engagement, popular events, active areas

---

## Technical Architecture

```
Frontend (React)
├── Pages: Landing, Auth, Dashboard, Discover, Events, Messages, Calendar, Settings
├── Components: DashboardLayout, UI components (shadcn)
├── Context: AuthContext (user state, token management)
└── Integrations: Leaflet maps, Stripe checkout

Backend (FastAPI)
├── Auth: JWT tokens, Google OAuth session handling
├── Models: Users, FamilyProfiles, Events, Messages, MeetupRequests
├── APIs: /api/auth/*, /api/family/*, /api/events/*, /api/messages/*
└── Integrations: MongoDB, Stripe, Emergent Auth

Database (MongoDB)
├── users: User accounts with subscription status
├── family_profiles: Family information and location
├── events: Meetups, playdates, field trips
├── messages: Chat messages between families
├── meetup_requests: Pending meetup proposals
├── user_sessions: Auth sessions
├── id_verifications: Verification requests
└── payment_transactions: Stripe payment records
```
