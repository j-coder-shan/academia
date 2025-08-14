# Assets Directory

This directory contains static assets for the Academia LMS frontend:

## Structure

- `images/` - Application images, logos, banners, course thumbnails
- `icons/` - UI icons, navigation icons, status indicators
- `favicon.ico` - Browser favicon

## Usage

Assets can be referenced in HTML files using relative paths:

```html
<!-- Example usage -->
<img src="../assets/images/logo.png" alt="Academia LMS Logo">
<link rel="icon" href="../assets/favicon.ico" type="image/x-icon">
```

## Recommended Assets

### Images
- `logo.png` - Main application logo
- `default-avatar.png` - Default user profile image
- `course-placeholder.jpg` - Default course thumbnail
- `hero-banner.jpg` - Landing page banner

### Icons
- `dashboard.svg` - Dashboard navigation icon
- `courses.svg` - Courses navigation icon
- `profile.svg` - Profile navigation icon
- `logout.svg` - Logout button icon
- `notification.svg` - Notification bell icon

## File Formats

- **Images**: PNG, JPG, WebP (for better compression)
- **Icons**: SVG (scalable), PNG (fallback)
- **Favicon**: ICO format for best browser compatibility

## Optimization

- Compress images for web delivery
- Use appropriate dimensions (avoid oversized images)
- Consider using WebP format for modern browsers
- Optimize SVG icons by removing unnecessary code
