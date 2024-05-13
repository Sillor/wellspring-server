// test.js
const axios = require('axios');

// Function to send a GET request to the server and validate the response
async function testGetRequest() {
  try {
    const response = await axios('http://example.com/api/data'); // Replace with your server URL and endpoint
    const data = await response.json();

    // Validate the response
    if (response.ok) {
      console.log('GET Request Successful');
      console.log('Response:', data);
      // Perform additional validation if needed
    } else {
      console.error('GET Request Failed:', response.status, data);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Function to send a POST request to the server and validate the response
async function testPostRequest() {
  const requestBody = {
    // Add your request body here if needed
  };

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      // Add any other headers if needed
    },
    body: JSON.stringify(requestBody)
  };

  try {
    const response = await axios('http://localhost:5174/patients', requestOptions); // Replace with your server URL and endpoint
    // const data = await response.json();

    // Validate the response
    if (response) {
      console.log('POST Request Successful');
      console.log('Response:', response.data.patients);
      // Perform additional validation if needed
    } else {
      console.error('POST Request Failed:', response.status, response.data.patients);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Call the test functions
// testGetRequest();
testPostRequest();