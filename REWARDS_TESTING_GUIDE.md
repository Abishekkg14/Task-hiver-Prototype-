# TaskHive Rewards System Testing Guide

This document provides comprehensive guidance for testing the TaskHive Rewards System integration.

## Setup Requirements

1. Make sure MongoDB is running
2. Start the TaskHive server:
   ```
   node server.js
   ```
3. Have at least two test accounts ready (one for creating tasks, one for completing them)

## Testing Methods

There are three primary ways to test the rewards system integration:

1. **Automated Tests**: Run the automated test suite
2. **Manual Tests**: Follow the step-by-step manual testing procedure
3. **API Tests**: Directly test the API endpoints

## Automated Testing

### Using the Test Page

1. Open `test_rewards_integration.html` in your browser
2. Click the "Run All Tests" button
3. Review the test results that appear below

### From the Dashboard

1. Open `dashboard.html` in your browser
2. Log in with your test credentials
3. Look for the floating test panel in the top-right corner
4. Click "Run Tests" to execute all automated tests

### What Gets Tested

The automated tests verify:

- User authentication
- Rewards system initialization
- Reward calculation for tasks
- Reward processing for completed tasks
- UI updates with rewards data
- Rewards history modal functionality

## Manual Testing

Follow these steps to manually test the complete rewards flow:

### Basic Functionality

1. **Login**: Log in to the TaskHive dashboard
2. **View Rewards Panel**: Verify the rewards panel shows on the dashboard
   - Check that available balance is displayed
   - Check that total earned amount is displayed
   - Check that your reward level is displayed

3. **View Rewards History**:
   - Click the "View History" button
   - Verify the modal opens properly
   - Check that your balance and earnings are displayed
   - Check that your level and progress bar are visible
   - Verify the transaction history table exists

4. **Check Redemption Options**:
   - In the rewards modal, verify redemption options are displayed
   - Check that options are enabled/disabled based on your balance
   - Verify redemption buttons are clickable if you have sufficient balance

5. **Check Leaderboard**:
   - Scroll down in the rewards modal to find the leaderboard
   - Verify the leaderboard shows user rankings
   - Check that your ranking is visible if you're in the top 10

### End-to-End Task Flow

To test the complete integration of rewards with task completion:

1. **Create a Task**:
   - Click "Create New Task" on the dashboard
   - Fill in the task details and submit

2. **Switch Accounts**:
   - Log out and log in with a different account
   - Navigate to the dashboard and find the task you created

3. **Accept the Task**:
   - Click on the task to view details
   - Click "Accept Task" to take on the task

4. **Mark as Completed**:
   - After "completing" the task (for testing purposes), click "Mark as Completed"
   - Add a completion note and submit

5. **Switch Back to Creator Account**:
   - Log out and log back in with the original account
   - Navigate to the dashboard and find the task

6. **Verify Completion**:
   - Find the task marked as awaiting verification
   - Click "Verify" to confirm the task is completed

7. **Check Rewards (Completer Account)**:
   - Log out and log back in with the account that completed the task
   - Verify that rewards were added to the account
   - Check that the transaction appears in the rewards history
   - Confirm that level progress was updated if applicable

### Redemption Testing

To test the reward redemption process:

1. **Ensure Sufficient Balance**:
   - Make sure your account has enough balance for redemption
   - If not, complete more tasks to earn rewards

2. **Open Rewards Modal**:
   - Click "View History" on the dashboard

3. **Select Redemption Option**:
   - Choose one of the available redemption options
   - Click the "Redeem" button

4. **Confirm Redemption**:
   - Verify the confirmation dialog appears
   - Confirm the redemption

5. **Check Results**:
   - Verify your balance was reduced accordingly
   - Check that the redemption appears in your transaction history
   - Confirm that a success notification was displayed

## API Testing

Use the API testing tab in `test_rewards_integration.html` to directly test the rewards API endpoints:

### GET /api/rewards
- Retrieves the user's rewards data
- Should return available balance, total earned, and transaction history

### POST /api/rewards/add
- Adds rewards to a user's account
- Parameters: `taskId`, `taskTitle`, `amount`

### POST /api/rewards/redeem
- Processes a reward redemption
- Parameters: `option`, `amount`

### GET /api/rewards/leaderboard
- Retrieves the top earners leaderboard
- Should return an array of top users with their earnings

## Common Issues and Troubleshooting

### Authentication Issues
- Ensure you're properly logged in
- Check that your token hasn't expired
- Look for 401 errors in the console

### Missing Rewards Data
- New users may not have rewards data yet
- Try completing a task to generate initial rewards data

### UI Not Updating
- Check the console for errors
- Verify that the DOM elements exist with the correct IDs
- Try refreshing the page

### Redemption Failures
- Ensure you have sufficient balance
- Check the redemption amount is valid
- Look for error messages in the response

## Reporting Issues

If you encounter bugs during testing, document the following information:

1. The specific test that failed
2. Steps to reproduce the issue
3. Expected vs. actual outcome
4. Any error messages from the console
5. Browser and system information

## Integration Test Success Criteria

The rewards system integration is considered successful when:

1. Rewards panel displays correctly on the dashboard
2. Rewards are automatically calculated and processed when tasks are verified
3. Transaction history shows all reward activities
4. Redemption options work as expected
5. Leaderboard displays correctly
6. Reward levels and progress tracking work accurately
7. All automated tests pass without errors
