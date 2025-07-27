# Gold Account Validation and Error Handling Implementation Guide

## Overview

This document describes the comprehensive validation and error handling system implemented for the Customer Gold Accounts feature. The system provides robust server-side validation, enhanced client-side error handling, network resilience, and user-friendly error messages in Persian.

## Features Implemented

### 1. Server-Side Validation

#### Enhanced API Validation
- **Comprehensive Input Validation**: All gold transaction endpoints now validate inputs with detailed error messages
- **Field-Specific Errors**: Each validation error is mapped to specific form fields
- **Business Rule Validation**: Enforces business rules like date ranges, amount limits, and description requirements
- **Database Constraint Validation**: Checks for customer existence, user permissions, and data integrity

#### Validation Rules

**Transaction Date**:
- Required field
- Cannot be in the future
- Cannot be before 2020-01-01
- Must be valid date format

**Transaction Type**:
- Required field
- Must be either 'debit' or 'credit'

**Amount (Grams)**:
- Required field
- Must be positive number
- Minimum: 0.001 grams
- Maximum: 10,000 grams

**Description**:
- Required field
- Minimum length: 5 characters
- Maximum length: 500 characters

**Customer ID**:
- Required field
- Must be valid integer
- Customer must exist and be active

#### Error Response Format
```json
{
  "success": false,
  "message": "اطلاعات وارد شده نامعتبر است",
  "errors": [
    {
      "field": "amount_grams",
      "message": "مقدار طلا باید عدد مثبت باشد"
    }
  ],
  "error_type": "validation_error",
  "request_id": "gold-create-1234567890-abc123"
}
```

### 2. Client-Side Error Handling

#### Network Monitoring
- **Online/Offline Detection**: Monitors network connectivity status
- **Visual Network Status**: Shows network status indicator to users
- **Automatic Retry**: Retries failed operations when connection is restored
- **Request Timeout Handling**: 30-second timeout with user-friendly messages

#### Error Classification
- **Network Errors**: Connection issues, timeouts, offline status
- **HTTP Errors**: 400, 401, 403, 404, 500 status codes with specific messages
- **Validation Errors**: Form validation with real-time feedback
- **Server Errors**: Database and application errors

#### User-Friendly Messages
All error messages are displayed in Persian with appropriate icons and styling:

- **Network Issues**: "خطا در اتصال به شبکه. لطفاً اتصال اینترنت خود را بررسی کنید"
- **Session Expired**: "جلسه کاری شما منقضی شده است. لطفاً دوباره وارد شوید"
- **Permission Denied**: "شما مجوز انجام این عملیات را ندارید"
- **Not Found**: "اطلاعات مورد نظر یافت نشد"
- **Server Error**: "خطای سرور رخ داده است. لطفاً دوباره تلاش کنید"

### 3. Form Validation

#### Real-Time Validation
- **Field-Level Validation**: Validates each field on blur/change events
- **Visual Feedback**: Red borders, error icons, and shake animations for invalid fields
- **Error Messages**: Contextual error messages below each field
- **Success Indicators**: Green styling for valid fields

#### Persian Date Validation
- **Format Validation**: Ensures YYYY/MM/DD format
- **Range Validation**: Accepts dates between 1300-1500 Persian calendar
- **Future Date Prevention**: Prevents selection of future dates
- **Auto-formatting**: Automatically formats date input as user types

### 4. Error Logging and Debugging

#### Client-Side Logging
- **Local Storage**: Stores last 50 errors in browser localStorage
- **Server Reporting**: Optionally sends errors to server for centralized logging
- **Request Tracking**: Each request has unique ID for debugging
- **Error Context**: Includes user agent, URL, timestamp, and operation details

#### Server-Side Logging
- **Structured Logging**: All operations logged with request IDs and timing
- **Error Classification**: Different log levels for validation, business, and system errors
- **Performance Monitoring**: Request processing time tracking
- **User Context**: Logs include user ID and session information

### 5. Enhanced User Experience

#### Loading States
- **Button Loading**: Buttons show spinner during operations
- **Form Overlay**: Semi-transparent overlay during form submission
- **Progress Indicators**: Visual feedback for long-running operations

#### Success/Error Messages
- **Toast Notifications**: Slide-in messages with auto-dismiss
- **Color Coding**: Green for success, red for errors, blue for info
- **Action Buttons**: Close buttons and retry options where appropriate
- **Accessibility**: Screen reader friendly with proper ARIA labels

## Implementation Details

### Server-Side Files Modified

1. **server.js**
   - Enhanced POST `/customers/:id/gold-transactions` with comprehensive validation
   - Enhanced PUT `/customers/:id/gold-transactions/:transactionId` with update validation
   - Enhanced DELETE `/customers/:id/gold-transactions/:transactionId` with business rules
   - Added GET `/customers/:id/gold-balance` for balance checking
   - Added POST `/api/log-client-error` for error logging

2. **database/gold-transactions-db.js**
   - Enhanced `validateTransactionData()` with field-specific errors
   - Added `validateUpdateData()` for partial updates
   - Improved error messages and validation logic

### Client-Side Files Modified

1. **public/js/gold-account.js**
   - Enhanced network request handling with retry logic
   - Added network monitoring and offline detection
   - Improved error handling with user-friendly messages
   - Enhanced form validation with real-time feedback
   - Added error logging and debugging features

2. **public/css/style.css**
   - Added comprehensive styles for error states
   - Enhanced form validation visual feedback
   - Added loading states and animations
   - Responsive error handling components

### Database Considerations

#### Error Logging Table (Optional)
```sql
CREATE TABLE client_errors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    component VARCHAR(100) NOT NULL,
    error_data JSON NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_date (user_id, created_at),
    INDEX idx_component (component)
);
```

## Usage Examples

### Server-Side Validation
```javascript
// Example API call with validation
app.post('/customers/:id/gold-transactions', requireAuth, async (req, res) => {
    const validationErrors = [];
    
    // Validate customer ID
    if (!customerId || isNaN(parseInt(customerId))) {
        validationErrors.push({
            field: 'customer_id',
            message: 'شناسه مشتری نامعتبر است'
        });
    }
    
    // Return validation errors
    if (validationErrors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'اطلاعات وارد شده نامعتبر است',
            errors: validationErrors,
            error_type: 'validation_error'
        });
    }
});
```

### Client-Side Error Handling
```javascript
// Example error handling in JavaScript
try {
    const response = await this.makeRequest('/api/endpoint', options);
    const result = await response.json();
    
    if (result.success) {
        this.showSuccess('عملیات با موفقیت انجام شد');
    } else {
        this.showError(result.message);
    }
} catch (error) {
    this.handleError(error, 'انجام عملیات');
}
```

### Form Validation
```javascript
// Example form field validation
validateField(fieldId) {
    const field = document.getElementById(fieldId);
    let isValid = true;
    let errorMessage = '';
    
    switch (fieldId) {
        case 'amountGrams':
            const amount = parseFloat(field.value);
            if (!field.value || isNaN(amount) || amount <= 0) {
                errorMessage = 'مقدار باید عدد مثبت باشد';
                isValid = false;
            }
            break;
    }
    
    if (!isValid) {
        this.showFieldError(fieldId, errorMessage);
    }
    
    return isValid;
}
```

## Testing

### Running Tests
```bash
node test-validation-error-handling.js
```

### Test Coverage
- ✅ Server-side validation with valid/invalid data
- ✅ Edge cases (minimum/maximum values)
- ✅ Update data validation
- ✅ Client-side error handling simulation
- ✅ Persian date validation
- ✅ Form validation scenarios

## Configuration

### Client-Side Configuration
```javascript
// Optional configuration in HTML
window.goldAccountConfig = {
    enableErrorReporting: true,
    autoRefresh: true,
    maxRetries: 3,
    requestTimeout: 30000
};
```

### Server-Side Configuration
```javascript
// Environment variables
process.env.ENABLE_ERROR_LOGGING = 'true'
process.env.MAX_VALIDATION_ERRORS = '10'
process.env.REQUEST_TIMEOUT = '30000'
```

## Best Practices

### Error Messages
1. **Use Persian Language**: All user-facing messages in Persian
2. **Be Specific**: Provide actionable error messages
3. **Avoid Technical Jargon**: Use business-friendly language
4. **Provide Solutions**: Suggest how to fix the error when possible

### Validation
1. **Validate Early**: Check inputs as soon as possible
2. **Validate Thoroughly**: Both client and server-side validation
3. **Provide Feedback**: Real-time validation feedback
4. **Handle Edge Cases**: Test boundary conditions

### Error Handling
1. **Graceful Degradation**: System should work even with errors
2. **User-Friendly**: Don't expose technical details to users
3. **Logging**: Log errors for debugging and monitoring
4. **Recovery**: Provide ways to recover from errors

## Troubleshooting

### Common Issues

1. **Network Timeouts**
   - Check internet connection
   - Verify server is running
   - Check firewall settings

2. **Validation Errors**
   - Verify input formats
   - Check required fields
   - Validate business rules

3. **Permission Errors**
   - Check user authentication
   - Verify user permissions
   - Check session expiration

### Debug Information

Error logs include:
- Request ID for tracking
- User context and session info
- Timestamp and operation details
- Stack traces for server errors
- Network status and browser info

## Future Enhancements

1. **Advanced Validation**
   - Custom validation rules
   - Conditional validation
   - Cross-field validation

2. **Error Analytics**
   - Error rate monitoring
   - User experience metrics
   - Performance tracking

3. **Internationalization**
   - Multiple language support
   - Localized error messages
   - Cultural date formats

4. **Accessibility**
   - Screen reader support
   - Keyboard navigation
   - High contrast mode

## Conclusion

The implemented validation and error handling system provides a robust, user-friendly experience for the Gold Account management feature. It ensures data integrity, provides clear feedback to users, and includes comprehensive debugging capabilities for developers.

The system follows modern web development best practices and provides a solid foundation for future enhancements and maintenance.