# Notify Super Admin on Profile Photo Change

**Categoria:** notifications  
**Versão:** 1.0.0  
**Descrição:** When a user changes their profile photo, the super admin user must be notified

**Autor:** Flow System  
**Data:** 2025-12-27  

---

## Contexto

When a regular user updates their profile photo in the system, the super administrator needs to be notified for auditing and monitoring purposes.

## Passos do Fluxo

### 1. [User Selects New Photo]

**Quando:** The user accesses their profile and clicks to change the photo

**Ação:** 
- User selects a new image from the device
- System validates image format (jpg, png, webp)
- System validates maximum size (5MB)
- Valid image is loaded in the interface
- Save button becomes enabled

### 2. [System Uploads Photo]

**Quando:** User confirms the photo change

**Ação:** 
- System uploads the image to Supabase Storage
- System updates the `avatar_url` field in the `users` table
- System stores the old photo URL for history
- Photo is successfully saved in storage
- User record is updated
- New photo URL is available

### 3. [System Identifies Super Admin]

**Quando:** Photo upload is completed successfully

**Ação:** 
- System searches the `users` table for all users where `is_admin_super = true`
- System obtains the IDs of these administrators
- List of super admin IDs is obtained
- If there is no super admin, the flow ends without error

### 4. [Database Creates Notification via Trigger]

**Quando:** `avatar_url` field of the `users` table is updated

**Ação:** 
- `on_profile_photo_change` trigger is fired
- System identifies super admins
- System creates a record in the `users_notifications` table for each super admin with:
- `user_id`: Super admin ID
- `title`: "Profile photo updated"
- `message`: "User [Name] updated their profile photo"
- `type`: "profile_photo_change"
- `related_user_id`: ID of the user who changed the photo
- `is_read`: false
- `created_at`: current timestamp
- Notification is automatically created by the database
- Notification appears for the super admin

### 5. [Super Admin Views Notification]

**Quando:** Super admin accesses the application

**Ação:** 
- System displays badge with the number of unread notifications
- Super admin clicks on the notification
- System marks notification as read (`is_read = true`)
- System navigates to the profile of the user who changed the photo
- Super admin views user information
- Notification is marked as read
- Notification badge is updated

