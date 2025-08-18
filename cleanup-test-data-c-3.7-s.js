/**
 * Cleanup Script for Test Data
 * 
 * This script removes all test users created for the filtering tests.
 * It reads the user IDs from the test-user-ids-c-3.7-s.json file.
 * 
 * IMPORTANT: This script should only be run after you're done testing!
 */

require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, deleteDoc, getDoc } = require('firebase/firestore');
const fs = require('fs');

// Initialize Firebase with config from environment variables
const firebaseConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}');
console.log('Initializing Firebase with project:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Load test user IDs
let testData = {};
try {
  testData = JSON.parse(fs.readFileSync('test-user-ids-c-3.7-s.json'));
  console.log(`Loaded ${testData.userIds.length} test user IDs with timestamp ${testData.timestamp}`);
} catch (error) {
  console.error('Error loading test user IDs. Please run setup-test-data-c-3.7-s.js first:', error);
  process.exit(1);
}

// Function to get user details before deletion
async function getUserDetails(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        id: userId,
        name: userData.name,
        location: userData.location
      };
    }
    return { id: userId, name: 'Unknown', location: 'Unknown' };
  } catch (error) {
    console.error(`Error getting details for user ${userId}:`, error);
    return { id: userId, name: 'Error', location: 'Error' };
  }
}

// Function to delete a test user from Firestore
async function deleteTestUser(userId) {
  try {
    // Get user details before deletion for logging
    const userDetails = await getUserDetails(userId);
    
    // Delete the user
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    
    console.log(`Deleted user: ${userDetails.name} (ID: ${userId})`);
    console.log(`  Location: ${userDetails.location || 'None'}`);
    return true;
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    return false;
  }
}

// Main function to delete all test users
async function cleanupTestData() {
  console.log('Starting cleanup of test data...');
  
  try {
    const { userIds } = testData;
    let successCount = 0;
    let failCount = 0;
    
    console.log(`Attempting to delete ${userIds.length} test users...`);
    
    // Delete each test user
    for (const userId of userIds) {
      const success = await deleteTestUser(userId);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }
    
    console.log('\n=== Cleanup Results ===');
    console.log(`- Successfully deleted: ${successCount} users`);
    console.log(`- Failed to delete: ${failCount} users`);
    
    if (failCount === 0) {
      // Delete the user IDs file if all deletions were successful
      fs.unlinkSync('test-user-ids-c-3.7-s.json');
      console.log('Removed test-user-ids-c-3.7-s.json file');
    }
    
    return { successCount, failCount };
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
}

// Confirmation to prevent accidental deletion
console.log('⚠️  WARNING: This script will permanently delete all test users!');
console.log('Please confirm by typing "cleanup" when prompted.');

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Type "cleanup" to confirm: ', (answer) => {
  if (answer.toLowerCase() === 'cleanup') {
    readline.close();
    
    // Run the cleanup
    cleanupTestData()
      .then(() => console.log('\nCleanup completed successfully'))
      .catch(err => console.error('\nCleanup failed:', err));
  } else {
    console.log('Cleanup cancelled. No data was deleted.');
    readline.close();
  }
});