# Design Document

## Overview

This design outlines the migration from CDN-hosted libraries to locally served assets for the gold shop web application. The migration will involve downloading the exact versions of libraries currently used, organizing them in the public directory structure, and updating template references to use local paths instead of CDN URLs.

## Architecture

The current architecture uses external CDN links in the main layout template (`views/layout.ejs`). The new architecture will serve all assets from the local `/public` directory through the Express.js static file serving middleware.

### Current CDN Dependencies
- Bootstrap 4.6.2 (CSS and JS)
- jQuery 3.6.0
- Moment.js 2.29.4
- Moment-jalaali 0.9.6

### New Local Structure
```
public/
├── css/
│   ├── style.css (existing)
│   └── bootstrap.min.css (new)
├── js/
│   ├── main.js (existing)
│   ├── jquery.min.js (new)
│   ├── bootstrap.bundle.min.js (new)
│   ├── moment.min.js (new)
│   └── moment-jalaali.js (new)
└── uploads/ (existing)
```

## Components and Interfaces

### File Download Component
- Download exact versions of libraries from their respective CDNs
- Verify file integrity and functionality
- Organize files in appropriate directory structure

### Template Update Component
- Update `views/layout.ejs` to reference local file paths
- Maintain the same loading order and dependencies
- Preserve all existing attributes and configurations

### Static File Serving
- Leverage existing Express.js static middleware configuration
- Ensure proper MIME types and caching headers
- Maintain performance characteristics

## Data Models

No new data models are required. This is purely a static asset migration.

## Error Handling

### Download Verification
- Verify each downloaded file matches expected size and content
- Validate JavaScript files can be parsed without syntax errors
- Test CSS files for proper formatting

### Fallback Strategy
- Keep original CDN references commented out for quick rollback if needed
- Test each library individually before final deployment
- Maintain backup of original layout.ejs file

### Runtime Error Handling
- Ensure proper error messages if local files fail to load
- Maintain existing error handling for JavaScript functionality
- Preserve console error reporting for debugging

## Testing Strategy

### Functional Testing
1. **Visual Regression Testing**
   - Compare UI appearance before and after migration
   - Verify all Bootstrap components render correctly
   - Check responsive design functionality

2. **JavaScript Functionality Testing**
   - Test all jQuery-dependent features
   - Verify moment.js date formatting works correctly
   - Validate Persian calendar functionality with moment-jalaali
   - Test Bootstrap JavaScript components (modals, dropdowns, etc.)

3. **Performance Testing**
   - Compare page load times before and after migration
   - Verify local file serving performance
   - Check for any caching issues

4. **Cross-browser Testing**
   - Test in multiple browsers to ensure compatibility
   - Verify local files work across different environments
   - Check for any browser-specific loading issues

### Implementation Testing Approach
1. Download and place files in local directory
2. Update template references one library at a time
3. Test each library individually before proceeding
4. Perform comprehensive testing after all migrations
5. Keep CDN references as comments for easy rollback during testing

## Migration Sequence

1. **Preparation Phase**
   - Create directory structure in `/public`
   - Download all required library files
   - Verify file integrity and versions

2. **Implementation Phase**
   - Update layout.ejs with local file references
   - Test each library replacement individually
   - Verify complete functionality

3. **Validation Phase**
   - Comprehensive testing of all features
   - Performance validation
   - Cross-browser compatibility check

This design ensures a safe, methodical migration that maintains all existing functionality while eliminating external CDN dependencies.