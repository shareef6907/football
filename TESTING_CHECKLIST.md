# Game Settings Management - Testing Checklist

## Database Setup
1. ✅ Run the SQL commands in `database_setup.sql` in Supabase SQL editor
2. ✅ Verify `game_settings` table exists
3. ✅ Check that sample record is inserted

## Admin Panel Testing (http://localhost:3000/admin)

### Access & Authentication
- [ ] Navigate to `/admin`
- [ ] Login with credentials (admin / thursday2024)
- [ ] Verify Game Time & Submission Window section appears
- [ ] Check that current settings display if any exist

### Game Settings Configuration
- [ ] **Set Custom Game Time**: Try setting game to Wednesday 8:30PM
- [ ] **Set Submission Window**: Set start to "now" and end to "next Thursday 6AM"
- [ ] **Save Settings**: Click "Save Game Settings" button
- [ ] **Verify Success**: Check for success message
- [ ] **Current Settings Display**: Verify active settings show correctly

### Form Validation
- [ ] **Empty Fields**: Try saving with empty fields (should show error)
- [ ] **Invalid Time Range**: Set end time before start time (should show error)
- [ ] **Valid Data**: Ensure valid data saves successfully

### Reset Functionality
- [ ] **Reset to Default**: Click "Reset to Default Schedule" button
- [ ] **Confirm Dialog**: Verify confirmation dialog appears
- [ ] **Default Behavior**: Verify system reverts to Thursday 8PM schedule

## Homepage Testing (http://localhost:3000)

### Countdown Timer
- [ ] **Custom Game Display**: Verify countdown shows custom game time
- [ ] **Dynamic Updates**: Check countdown updates every second
- [ ] **Game in Progress**: Test during game time (shows "Game in Progress")
- [ ] **Past Game**: Test after game time

### Submission Window Status
- [ ] **Window Open**: When window is open, shows "Submission window is OPEN ✅"
- [ ] **Window Closed**: When closed, shows "Submission window is CLOSED ❌"
- [ ] **Dynamic Updates**: Status updates without page refresh

### Stats Submission
- [ ] **Window Open**: Button enabled when window open
- [ ] **Window Closed**: Button disabled and shows "Submission Closed"
- [ ] **Form Interaction**: All form fields work correctly
- [ ] **Already Submitted**: Shows "Already Submitted" for submitted players

### Fallback Behavior
- [ ] **No Custom Settings**: Verify default Thursday logic works
- [ ] **API Failure**: Test behavior when game settings API fails

## API Endpoint Testing

### GET /api/admin/game-settings
- [ ] **With Settings**: Returns active and all settings
- [ ] **No Settings**: Returns null for active settings
- [ ] **Error Handling**: Graceful error responses

### POST /api/admin/game-settings
- [ ] **Valid Data**: Creates new settings and deactivates old ones
- [ ] **Invalid Data**: Returns appropriate error messages
- [ ] **Time Validation**: Validates start time before end time
- [ ] **Date Format**: Handles date format validation

### DELETE /api/admin/game-settings
- [ ] **Deactivation**: Successfully deactivates all settings
- [ ] **System Revert**: Confirms system reverts to default

## Integration Testing

### Database Integration
- [ ] **Settings Persistence**: Settings saved correctly in database
- [ ] **Active Flag**: Only one setting active at a time
- [ ] **Timestamp Accuracy**: Timestamps stored correctly

### UI State Management
- [ ] **Real-time Updates**: Changes reflect immediately
- [ ] **State Synchronization**: All components show consistent state
- [ ] **Error Handling**: UI handles API errors gracefully

### Submission Logic
- [ ] **Window Validation**: Submissions only work in valid window
- [ ] **Player Tracking**: Correctly tracks submitted players
- [ ] **Database Queries**: Uses correct time ranges for queries

## Edge Cases & Error Handling

### Time Zone Handling
- [ ] **UTC Conversion**: All times stored/retrieved in UTC correctly
- [ ] **Display Format**: Times displayed in user-friendly format
- [ ] **Bahrain Time**: Maintains compatibility with existing Bahrain time logic

### Network Issues
- [ ] **API Timeouts**: Graceful handling of API timeouts
- [ ] **Connection Loss**: Proper error messages for connection issues
- [ ] **Retry Logic**: Appropriate retry mechanisms

### Concurrent Access
- [ ] **Multiple Admins**: Multiple admin sessions work correctly
- [ ] **Settings Conflicts**: Last save wins behavior
- [ ] **Race Conditions**: No race conditions in settings updates

## Performance Testing
- [ ] **Page Load Speed**: Admin panel loads quickly
- [ ] **API Response Time**: All API calls respond under 2 seconds
- [ ] **Real-time Updates**: Timer updates don't cause performance issues

## Cross-Browser Testing
- [ ] **Chrome**: All functionality works in Chrome
- [ ] **Firefox**: All functionality works in Firefox
- [ ] **Safari**: All functionality works in Safari
- [ ] **Mobile**: Responsive design works on mobile devices

## Specific Test Scenarios

### Scenario 1: Wednesday 8:30PM Game
1. Set game time to this Wednesday 8:30PM
2. Set submission start to now
3. Set submission end to next Thursday 6AM
4. Verify countdown shows correct time
5. Verify submission window is open
6. Test stat submission works
7. Test after game ends submission still works until Thursday 6AM

### Scenario 2: Weekend Tournament
1. Set game time to Saturday 7PM
2. Set submission window Thursday-Sunday
3. Verify all functionality works with non-standard schedule

### Scenario 3: Emergency Reset
1. Set custom settings
2. Reset to default via admin panel
3. Verify system returns to Thursday 8PM schedule
4. Verify homepage shows correct information

## Final Validation
- [ ] **Feature Complete**: All requested features working
- [ ] **User Experience**: Intuitive and user-friendly
- [ ] **Error Handling**: Comprehensive error handling
- [ ] **Documentation**: Clear instructions for admin usage
- [ ] **Production Ready**: Code quality and security standards met