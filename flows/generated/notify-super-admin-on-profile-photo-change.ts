/**
 * Notify Super Admin on Profile Photo Change
 * 
 * Category: notifications
 * Version: 1.0.0
 * Description: When a user changes their profile photo, the super admin user must be notified
 * 
 * ATTENTION: This code was automatically generated from a .flow file
 * Use as REFERENCE for implementation. Adapt as necessary.
 * 
 * Source file: flows/notifications/change-profile-photo.flow
 */

import { supabase } from '@/services/supabase';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ProfilePhotoChangeInput {
    userId: string;
    newPhotoFile: File;
    oldPhotoUrl?: string;
}

export interface ProfilePhotoChangeResult {
    success: boolean;
    message?: string;
    newPhotoUrl?: string;
    notificationsSent?: number;
}

export interface NotificationData {
    user_id: string;
    title: string;
    message: string;
    type: string;
    related_user_id?: string;
    is_read: boolean;
    created_at: string;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Main function: Notify Super Admin on Profile Photo Change
 * 
 * This function implements the flow described in natural language.
 * Review each step and adapt according to your project's architecture.
 * 
 * FULL FLOW:
 * 1. Validate selected image
 * 2. Upload photo to Supabase Storage
 * 3. Identify super admin users
 * 4. Create notifications for admins
 * 5. (Admin views notification - implemented in notifications component)
 */
export async function notifySuperAdminOnProfilePhotoChange(
    input: ProfilePhotoChangeInput
): Promise<ProfilePhotoChangeResult> {
    try {
        // ========================================================================
        // STEP 1: Validate Selected Image
        // ========================================================================
        // When: User selects a new image
        // Action: Validate format (jpg, png, webp) and size (max 5MB)
        // Expected Result: Valid image ready for upload

        const validationResult = validateProfilePhoto(input.newPhotoFile);
        if (!validationResult.isValid) {
            return {
                success: false,
                message: validationResult.error
            };
        }

        // ========================================================================
        // STEP 2: Upload Photo to Supabase Storage
        // ========================================================================
        // When: Image is successfully validated
        // Action: 
        // - Upload to Supabase Storage bucket 'avatars'
        // - Update avatar_url field in users table
        // - Store old photo URL for history
        // Expected Result: Photo saved and record updated

        const uploadResult = await uploadProfilePhoto(
            input.userId,
            input.newPhotoFile
        );

        if (!uploadResult.success || !uploadResult.photoUrl) {
            return {
                success: false,
                message: 'Error uploading photo'
            };
        }

        // Update user record
        const { error: updateError } = await supabase
            .from('users')
            .update({ avatar_url: uploadResult.photoUrl })
            .eq('id', input.userId);

        if (updateError) {
            throw new Error(`Error updating avatar_url: ${updateError.message}`);
        }

        // ========================================================================
        // STEP 3: Identify Super Admin Users
        // ========================================================================
        // When: Upload completed successfully
        // Action: Search for all users with is_admin_super = true
        // Expected Result: List of super admin IDs

        const adminSuperUsers = await getAdminSuperUsers();

        if (adminSuperUsers.length === 0) {
            // No super admin, flow ends without error
            return {
                success: true,
                message: 'Photo updated successfully (no admins to notify)',
                newPhotoUrl: uploadResult.photoUrl,
                notificationsSent: 0
            };
        }

        // ========================================================================
        // STEP 4: Create Notifications for Admins
        // ========================================================================
        // When: Super admin identified
        // Action: Create record in notifications table
        // Expected Result: Notification created and visible to admin

        const { data: userData } = await supabase
            .from('users')
            .select('name_full')
            .eq('id', input.userId)
            .single();

        const userName = userData?.name_full || 'User';

        const notificationsCreated = await createNotificationsForAdmins(
            adminSuperUsers,
            {
                title: 'Profile photo updated',
                message: `${userName} updated their profile photo`,
                type: 'profile_photo_change',
                related_user_id: input.userId
            }
        );

        // ========================================================================
        // STEP 5: Admin Views Notification
        // ========================================================================
        // When: Super admin accesses the application
        // Action: 
        // - Display badge with unread notifications
        // - On click, mark as read
        // - Navigate to user profile
        // Expected Result: Admin views user information
        // 
        // NOTE: This step is implemented in the notifications component,
        // not in this function. See: views/Notifications/NotificationsList.tsx

        return {
            success: true,
            message: 'Photo updated and admins notified successfully',
            newPhotoUrl: uploadResult.photoUrl,
            notificationsSent: notificationsCreated
        };

    } catch (error) {
        console.error('Error executing photo change flow:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates profile photo format and size
 */
function validateProfilePhoto(file: File): { isValid: boolean; error?: string } {
    // Validate format
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validFormats.includes(file.type)) {
        return {
            isValid: false,
            error: 'Invalid format. Use JPG, PNG or WEBP'
        };
    }

    // Validate size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        return {
            isValid: false,
            error: 'File too large. Maximum size: 5MB'
        };
    }

    return { isValid: true };
}

/**
 * Uploads photo to Supabase Storage
 */
async function uploadProfilePhoto(
    userId: string,
    file: File
): Promise<{ success: boolean; photoUrl?: string }> {
    try {
        // Generate unique file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            throw uploadError;
        }

        // Get public URL
        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return {
            success: true,
            photoUrl: data.publicUrl
        };

    } catch (error) {
        console.error('Upload error:', error);
        return { success: false };
    }
}

/**
 * Searches for all users with is_admin_super = true
 */
async function getAdminSuperUsers(): Promise<string[]> {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('is_admin_super', true);

        if (error) {
            throw error;
        }

        return data?.map(user => user.id) || [];

    } catch (error) {
        console.error('Error fetching super admins:', error);
        return [];
    }
}

/**
 * Creates notifications for multiple admins
 */
async function createNotificationsForAdmins(
    adminIds: string[],
    notificationData: {
        title: string;
        message: string;
        type: string;
        related_user_id?: string;
    }
): Promise<number> {
    try {
        const notifications: NotificationData[] = adminIds.map(adminId => ({
            user_id: adminId,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type,
            related_user_id: notificationData.related_user_id,
            is_read: false,
            created_at: new Date().toISOString()
        }));

        const { error } = await supabase
            .from('notifications')
            .insert(notifications);

        if (error) {
            throw error;
        }

        return notifications.length;

    } catch (error) {
        console.error('Error creating notifications:', error);
        // Do not fail the flow if notification fails
        return 0;
    }
}

/**
 * Marks notification as read (used by notifications component)
 */
export async function markNotificationAsRead(
    notificationId: string
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('id', notificationId);

        return !error;

    } catch (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Example of how to use this function in a React component
 * 
 * ```typescript
 * import { notifySuperAdminOnProfilePhotoChange } from '@/flows/generated/notify-super-admin-on-profile-photo-change';
 * 
 * const handlePhotoChange = async (file: File) => {
 *   const result = await notifySuperAdminOnProfilePhotoChange({
 *     userId: currentUser.id,
 *     newPhotoFile: file,
 *     oldPhotoUrl: currentUser.avatar_url
 *   });
 * 
 *   if (result.success) {
 *     console.log('Photo updated!', result.newPhotoUrl);
 *     console.log('Notifications sent:', result.notificationsSent);
 *   } else {
 *     console.error('Error:', result.message);
 *   }
 * };
 * ```
 */
