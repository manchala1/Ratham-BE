const express = require('express');
const uuid = require('uuid');
const moment = require('moment');
const app = express();
const studentSessionModel = require('./models/studentSession');
const port = process.env.PORT || 3000;

const mongoose = require('mongoose');

const mongoURI = 'mongodb://127.0.0.1:27017/rathnam';

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

// Get the default connection
const db = mongoose.connection;

// Handle connection errors
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB successfully');
});


// Middleware to parse JSON request bodies
app.use(express.json());

const userTokens = {};

// Replace this with your actual student data (e.g., from a database)
const students = [
  { universityID: 'studentA', password: 'password123', designation:"student" },
  { universityID: 'studentB', password: 'password124', designation:"student" },
  { universityID: 'dean1', password: 'password125', designation:"dean" }
  // Add more students here
];


// Authentication middleware
function authenticateStudent(req, res, next) {
  const { universityID, password } = req.body;
  const user = students.find((s) => s.universityID === universityID);

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
  userTokens[user.universityID] = uuid.v4();
  userTokens["designation"]=user.designation;
  next();
}



// Student authentication endpoint
app.post('/auth/student', authenticateStudent, (req, res) => {
  res.json({ token: userTokens[req.body.universityID] });
});

function authenticateUser(req, res, next) {
    const token = req.header('Authorization');
    console.log("token",token)
    console.log(userTokens)
  
    if (!token || !userTokens[req.body.universityID] || userTokens[req.body.universityID] !== token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  
    next();
  }

app.post('/create-session',authenticateUser,async (req, res) =>{

    try{
        const studentSession = new studentSessionModel({
            universityID:req.body.universityID,
            scheduledTime: new Date(req.body.scheduledTime),
            deanId:req.body.deanId
          });
    
        const data=await studentSession.save()    
        res.status(201).json(data);  
    }catch(error){
        console.log(error)
        res.status(500).json({ error: 'please enter valid date it should be thursday or friday 10AM.' });
    }   

})

app.post('/list',authenticateUser,async (req, res) =>{
    const designation=userTokens["designation"]
    if (designation=='student'){
        const pageSize = req.query.pageSize || 10; // Default page size is 10
        const currentPage = req.query.page || 1; // Default current page is 1
      
        // Calculate the start and end dates for the pagination
        const startDate = moment();
        const endDate = moment().add(1, 'year');
      
        // Calculate the total number of days in the range
        const totalDays = endDate.diff(startDate, 'days') + 1;
      
        // Initialize an array to store the paginated Thursdays and Fridays
        const paginatedDays = [];
      
        // Loop through dates and add Thursdays and Fridays to the array
        const currentDate = startDate.clone();
        let count = 0;
        while (currentDate.isBefore(endDate)) {
          if (currentDate.day() === 4 || currentDate.day() === 5) {
            count++;
            if (count > (currentPage - 1) * pageSize && count <= currentPage * pageSize) {
              paginatedDays.push(currentDate.format('YYYY-MM-DD'));
            }
          }
      
          currentDate.add(1, 'day');
        }

        const existingRecords = await studentSessionModel.find({
            your_date_field: { $in: all10AMDates }, // Replace with your date field name
          }).toArray();
      
          // Extract the existing dates from the records
          const existingDates = existingRecords.map(record => record.your_date_field);
      
          // Filter the list of all 10 AM dates to get only the ones that exist in the database
          const datesInDb = all10AMDates.filter(date => existingDates.includes(date));
      
        // Send the paginated list as a JSON response
        res.json({
          totalPages: Math.ceil(totalDays / pageSize),
          currentPage: parseInt(currentPage),
          pageSize: parseInt(pageSize),
          days: paginatedDays,
        });
    }
})

// // Sample dean's session data (include booked slots)
// const deanSessions = [
//     { day: 'Thursday', time: '10:00 AM', bookedBy: null },
//     { day: 'Friday', time: '10:00 AM', bookedBy: null },
//   ];
  
//   // Endpoint to get the list of dean's free sessions
//   app.get('/dean/free-sessions', (req, res) => {
//     // Return the dean's free sessions as JSON
//     res.json({ sessions: deanSessions });
//   });

// // Endpoint to book a dean slot
// app.post('/dean/book-slot', authenticateStudent, (req, res) => {
//     // Parse the selected slot data from the request body
//     const { day, time } = req.body;
  
//     // Check if the selected slot is available
//     const isSlotAvailable = deanSessions.some(
//       (session) => session.day === day && session.time === time
//     );
  
//     if (!isSlotAvailable) {
//       return res.status(400).json({ message: 'Selected slot is not available' });
//     }
  
//     // Implement logic to mark the slot as booked (e.g., update a database)
  
//     res.json({ message: 'Slot booked successfully' });
//   });


// // Endpoint for dean authentication
// app.post('/auth/dean', (req, res) => {
//     const { universityID, password } = req.body;
  
//     // Check dean's credentials (replace with actual authentication logic)
//     if (universityID === 'deanID' && password === 'deanPassword') {
//       // Generate a unique token for the dean
//       const deanToken = uuid.v4(); // Implement the UUID generation function
  
//       // Return the dean's token in the response
//       res.json({ token: deanToken });
//     } else {
//       res.status(401).json({ message: 'Authentication failed' });
//     }
//   });
  


// // Endpoint for dean to see pending sessions
// app.get('/dean/pending-sessions',  (req, res) => {
//     // Filter dean sessions to get the ones that are booked
//     const pendingSessions = deanSessions.filter((session) => session.bookedBy !== null);
  
//     // Return the list of pending sessions
//     res.json({ sessions: pendingSessions });
//   });

//   // Endpoint for dean to see all pending sessions
// app.get('/dean/all-pending-sessions', (req, res) => {
//     // Filter dean sessions to get the ones that are booked
//     const allPendingSessions = deanSessions.filter((session) => session.bookedBy !== null);
  
//     // Return the list of all pending sessions
//     res.json({ sessions: allPendingSessions });
//   });
// // Function to check if a session has passed
// function hasSessionPassed(session) {
//     // Implement logic to check if the session time has passed
//     // For example, compare the session time with the current time
//     // and return true if it has passed.
//   }
  
//   // Check and update the session status
//   deanSessions.forEach((session) => {
//     if (session.bookedBy !== null && hasSessionPassed(session)) {
//       // Mark the session as completed or remove it from the list
//       // Update the session status as needed.
//     }
//   });
    
// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
