---
name: Klaussified
tools: [Web App]
image:
description: A modern, feature-rich Secret Santa web application built with Flutter and Firebase.
---

<h2 style="text-align:center; font-weight: bold;"><span class="project-title">Klaussified</span></h2>
  <br>

Klaussified makes organizing Secret Santa gift exchanges effortless and exciting. Create groups, invite friends, and let the app handle the magic of random assignments while keeping everything secret until the big reveal.
<br>

## Key Features

### User Experience

- **Dual Authentication** - Login with email or username for flexibility
- **Christmas-Themed UI** - Festive color scheme (red, green, white) throughout the app
- **Smooth Animations** - Engaging vertical slot machine animation for the Secret Santa draw
- **Responsive Design** - Works seamlessly on desktop and mobile browsers
- **Path-Based URLs** - Clean URLs without hash fragments for better UX
- **Support & Feedback** - In-app contact form and Ko-fi donation support

### Group Management

- **Easy Group Creation** - Set up groups with custom names, descriptions, locations, budgets, and deadlines
- **Flexible Member Limits** - Support for 3 to 100 members per group
- **Member Management** - Add/remove members before starting the exchange
- **Group Ownership** - Owners have special permissions to edit details, manage members, and delete groups
- **Active/Closed States** - Clear distinction between ongoing exchanges and completed ones
- **Group Details** - Optional fields for location, budget suggestions, and pick deadlines

### Invitation System

- **Direct Invitations** - Send invites by username to specific users
- **Accept/Decline** - Members can choose whether to join
- **Notification Indicators** - Visual badges showing pending invitations count
- **Auto-Cleanup** - Declined invitations are automatically removed
- **Duplicate Prevention** - Cannot send duplicate invites to the same user

### Secret Santa Assignment

- **Two-Phase Draw System**:
  - **Owner-Initiated Draw** - Group owner generates all assignments at once using a derangement algorithm
  - **Member Reveal** - Members click to reveal their pre-assigned Secret Santa
- **Smart Derangement Algorithm** - Ensures everyone gets exactly one pick and is picked exactly once, with no self-assignments
- **Fair Random Distribution** - Fisher-Yates shuffle guarantees unbiased assignments
- **Atomic Operations** - All assignments created in a single transaction for data consistency
- **Fallback Assignment** - Legacy one-by-one assignment system as backup

### Profile & Gift Hints

- **Group-Specific Profiles** - Each group has isolated profile details
- **Real Name Field** - Optional real name (separate from username)
- **Hobbies & Interests** - Share what you enjoy to help your Secret Santa
- **Gift Wishes** - Provide hints, sizes, preferences, and wish lists
- **Private Details** - Profile information only visible to your assigned Secret Santa
- **Profile Updates** - Members can update their profile anytime before reveal

### Reveal System

- **Controlled Reveal** - Members can view their assignment anytime after the owner starts the draw
- **Gift Hints Display** - See your pick's profile details, hobbies, and wishes
- **Beautiful Presentation** - Celebration-themed UI with gradient cards and slot machine animation
- **Privacy Reminders** - Visual cues to keep assignments secret
- **Progress Tracking** - See how many members have revealed their assignments
  <br>

<p align="center"><a class="github-button img-bright" href="https://github.com/nairdahh/Klaussified" data-color-scheme="no-preference: light; light: light; dark: dark;" data-size="large" aria-label="View Klaussified on GitHub">View on GitHub</a></p>

<p align="center"><a href="https://ko-fi.com/nairdah" class="img-href img-bright"><img src="https://ko-fi.com/img/githubbutton_sm.svg" /></a></p>
