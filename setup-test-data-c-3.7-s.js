/**
 * Test Data Setup Script for Location and Age Range Filtering Tests
 * 
 * This script creates test users in Firebase Firestore with various
 * combinations of location (full addresses), age, and gender for testing the filtering features.
 */

require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, Timestamp } = require('firebase/firestore');
const fs = require('fs');

// Initialize Firebase with config from environment variables
const firebaseConfig = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}');
console.log('Initializing Firebase with project:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Current timestamp for generating unique IDs
const timestamp = Date.now();

// Sample addresses for different cities
const londonAddresses = [
  '45 Oxford Street, London, W1D 1BW',
  '12 Baker Street, London, NW1 6XE',
  '78 Camden High Street, London, NW1 7JL',
  '25 Regent Street, London, SW1Y 4DL',
  '134 Kensington High Street, London, W8 5SN'
];

const manchesterAddresses = [
  '87 Deansgate, Manchester, M3 2BW',
  '23 Market Street, Manchester, M1 1WR',
  '56 Portland Street, Manchester, M1 4QA',
  '12 Oxford Road, Manchester, M1 5QA',
  '34 Princess Street, Manchester, M1 4JY'
];

const birminghamAddresses = [
  '78 New Street, Birmingham, B2 4QA',
  '15 Corporation Street, Birmingham, B2 4RN',
  '43 Bull Street, Birmingham, B4 6AF',
  '29 High Street, Birmingham, B4 7SX',
  '67 Colmore Row, Birmingham, B3 2AP'
];

// Extract city name from full address for ID generation
function getCityFromAddress(address) {
  if (!address) return 'noloc';
  const cityMatch = address.match(/,\s*([^,]+),/);
  return cityMatch ? cityMatch[1].toLowerCase().replace(/\s+/g, '') : 'unknown';
}

// Test user definition
const testUsers = [
  // London users with various ages
  {
    location: londonAddresses[0],
    age: 22,
    gender: 'male',
  },
  {
    location: londonAddresses[1],
    age: 28,
    gender: 'female',
  },
  {
    location: londonAddresses[2],
    age: 35,
    gender: 'male',
  },
  {
    location: londonAddresses[3],
    age: 45,
    gender: 'female',
  },
  
  // Manchester users with various ages
  {
    location: manchesterAddresses[0],
    age: 25,
    gender: 'female',
  },
  {
    location: manchesterAddresses[1],
    age: 32,
    gender: 'male',
  },
  {
    location: manchesterAddresses[2],
    age: 42,
    gender: 'female',
  },
  
  // Birmingham users with various ages
  {
    location: birminghamAddresses[0],
    age: 27,
    gender: 'male',
  },
  {
    location: birminghamAddresses[1],
    age: 38,
    gender: 'female',
  },
  
  // No location user
  {
    location: null,
    age: 29,
    gender: 'male',
  }
];

// Create a "current user" for testing with preferences
const currentUser = {
  location: londonAddresses[4],
  ageRange: [25, 40],
  gender: 'female',
  showMe: 'male',
};

// Function to calculate birthdate from age
function calculateBirthdate(age) {
  const now = new Date();
  return new Date(now.getFullYear() - age, now.getMonth(), now.getDate());
}

// Function to create a test user in Firestore
async function createTestUser(userData) {
  try {
    // Generate a unique ID that includes test parameters
    const cityForId = userData.location ? getCityFromAddress(userData.location) : 'noloc';
    const userId = `test-user-${cityForId}-${userData.age}-${userData.gender}-${timestamp}`;
    
    // Calculate birthdate from age
    const birthdate = calculateBirthdate(userData.age);
    
    // Create the full user data object
    const user = {
      id: userId,
      name: `Test ${userData.gender === 'male' ? 'Man' : 'Woman'} ${userData.age} ${cityForId}`,
      aboutMe: `I am a test user for filtering. I am ${userData.age} years old${userData.location ? ' from ' + userData.location : ''}.`,
      gender: userData.gender,
      showMe: userData.gender === 'male' ? 'female' : 'male', // Opposite gender preference
      birthdate: Timestamp.fromDate(birthdate),
      location: userData.location,
      ageRange: [Math.max(18, userData.age - 5), userData.age + 5], // Default age range preference
      profilePicture: `https://example.com/test-${userData.gender}-${userData.age}.jpg`,
      phoneNumber: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date())
    };
    
    // Save to Firestore
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, user);
    console.log(`Created user: ${user.name} (ID: ${userId})`);
    console.log(`  Location: ${user.location || 'None'}`);
    
    return { id: userId, ...user };
  } catch (error) {
    console.error(`Error creating test user:`, error);
    throw error;
  }
}

// Function to create the current test user
async function createCurrentTestUser() {
  try {
    // Generate a unique ID for the current user
    const userId = `test-current-user-${timestamp}`;
    
    // Calculate birthdate from age (use 30 for current user)
    const birthdate = calculateBirthdate(30);
    
    // Create the full user data object
    const user = {
      id: userId,
      name: 'Current Test User',
      aboutMe: 'I am the current user for testing filters',
      gender: currentUser.gender,
      showMe: currentUser.showMe,
      birthdate: Timestamp.fromDate(birthdate),
      location: currentUser.location,
      ageRange: currentUser.ageRange,
      profilePicture: 'https://example.com/current-user.jpg',
      phoneNumber: '+19876543210',
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date())
    };
    
    // Save to Firestore
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, user);
    console.log(`Created current test user: ${user.name} (ID: ${userId})`);
    console.log(`  Location: ${user.location || 'None'}`);
    
    return { id: userId, ...user };
  } catch (error) {
    console.error(`Error creating current test user:`, error);
    throw error;
  }
}

// Main function to set up all test data
async function setupTestData() {
  console.log('Setting up test data...');
  
  const createdUsers = [];
  let currentUserData = null;
  
  try {
    // Create all test users
    for (const userData of testUsers) {
      const user = await createTestUser(userData);
      createdUsers.push(user);
    }
    
    // Create current test user
    currentUserData = await createCurrentTestUser();
    createdUsers.push(currentUserData);
    
    console.log(`\nCreated ${createdUsers.length} test users successfully`);
    
    // Save user IDs to a file for later cleanup
    const userIds = createdUsers.map(user => user.id);
    fs.writeFileSync('test-user-ids-c-3.7-s.json', JSON.stringify({
      timestamp,
      userIds,
      currentUserId: currentUserData.id
    }, null, 2));
    
    console.log('Test user IDs saved to test-user-ids-c-3.7-s.json');
    console.log('\nTest data setup complete!');
    return { createdUsers, currentUser: currentUserData };
    
  } catch (error) {
    console.error('Error setting up test data:', error);
    throw error;
  }
}

// Run the setup
setupTestData()
  .then(() => console.log('Setup completed successfully'))
  .catch(err => console.error('Setup failed:', err));