# TaskHive Rewards System Documentation

## Overview

TaskHive's AI Rewards System is an intelligent incentive mechanism that automatically calculates and distributes rewards to users when they complete tasks within the platform. The system uses AI to determine appropriate reward amounts based on task complexity, time taken, and other factors.

## Features

### For Users

- **Automatic Rewards**: Earn rewards automatically when tasks are verified as completed
- **Rewards Dashboard**: View available balance, total earnings, and rewards history
- **Rewards Levels**: Progress through different levels (Beginner to Diamond) based on total earnings
- **Redemption Options**: Redeem rewards for gift cards, charity donations, or premium features
- **Leaderboard**: See top earners in the TaskHive community

### For Developers

- **AI-Powered Calculation**: Uses Gemini API to intelligently determine reward amounts
- **Fallback System**: Includes a fallback calculation when AI is unavailable
- **API Integration**: Complete REST API for managing rewards
- **Rewards Database**: MongoDB integration for storing reward data

## User Guide

### Earning Rewards

1. Complete tasks assigned to you
2. Wait for the task creator to verify your work
3. Upon verification, rewards are automatically calculated and added to your account
4. View your updated balance in the rewards panel on the dashboard

### Viewing Rewards

1. Log in to your TaskHive account
2. View the rewards summary panel on the dashboard
3. Click "View History" to see detailed transaction history, redemption options, and the leaderboard

### Redeeming Rewards

1. Open the rewards history modal from the dashboard
2. Browse available redemption options
3. Select the desired option and click the redeem button
4. Confirm your redemption
5. Your balance will be updated and the redemption will be added to your history

### Reward Levels

- **Beginner**: 0+ total earnings
- **Bronze**: $50+ total earnings
- **Silver**: $150+ total earnings
- **Gold**: $300+ total earnings
- **Platinum**: $500+ total earnings
- **Diamond**: $1000+ total earnings

## Developer Documentation

### Files Structure

- `rewards-system.js`: Frontend rewards system implementation
- `rewards-styles.css`: CSS styles for rewards UI components
- `routes/rewards.js`: Backend API routes for rewards functionality
- `models/Reward.js`: MongoDB schema for rewards data

### API Endpoints

#### GET /api/rewards
- **Description**: Get rewards data for the current user
- **Authentication**: Required
- **Response**:
```json
{
  "userId": "user_id",
  "totalEarned": 350.75,
  "availableBalance": 225.50,
  "history": [...]
}
```

#### POST /api/rewards/add
- **Description**: Add rewards to user account
- **Authentication**: Required
- **Request Body**:
```json
{
  "taskId": "task_id",
  "taskTitle": "Task Title",
  "amount": 15.50
}
```
- **Response**: Updated rewards data

#### POST /api/rewards/redeem
- **Description**: Redeem rewards from user account
- **Authentication**: Required
- **Request Body**:
```json
{
  "option": "gift-card-5",
  "amount": 5.00
}
```
- **Response**: Updated rewards data

#### GET /api/rewards/leaderboard
- **Description**: Get top users by total earnings
- **Authentication**: Required
- **Response**: Array of top users with their total earnings

### Reward Calculation

The system uses the Gemini API to analyze task details and determine an appropriate reward amount. Factors considered include:

- Task complexity
- Description length and detail
- Time taken to complete
- Type of task

If the AI calculation fails, a fallback calculation is used based on task duration and type.

## Integration

The rewards system is fully integrated into the TaskHive platform:

1. **Dashboard**: Shows rewards summary and access to detailed history
2. **Task Verification**: Automatically processes rewards when tasks are verified
3. **User Profile**: Displays user's current level and total earnings

## Troubleshooting

### Common Issues

- **Rewards not showing**: Ensure you're logged in and have completed/verified tasks
- **Can't redeem rewards**: Check that you have sufficient balance
- **Missing history**: New users won't have transaction history until completing tasks

### Backend Errors

- **401 Unauthorized**: User is not authenticated
- **400 Bad Request**: Invalid data in the request
- **404 Not Found**: Reward record not found for the user
- **500 Server Error**: Internal server error during processing

## Future Enhancements

- Mobile app integration
- Additional redemption options
- Social sharing of achievements
- Team-based rewards for collaborative tasks
- Custom badges and achievements
