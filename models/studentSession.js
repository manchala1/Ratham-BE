const mongoose = require('mongoose');
const Schema = mongoose.Schema;

function isThursdayOrFriday(value) {
    if (!(value instanceof Date)) {
      return false;
    }
    console.log(value)
  
    // Check if it's Thursday (dayOfWeek 4) or Friday (dayOfWeek 5) at 10 AM (ist time)
    return value.getDay() === 4 || value.getDay() === 5 && value.getHours() === 4 && value.getMinutes() === 30 && value.getSeconds() === 0;
  }

  
const studentSessionSchema = new Schema({
    universityID: {type:String,required:true},
    scheduledTime: {
        type: Date,
        required: true,
        validate: [isThursdayOrFriday, 'Invalid event date. Must be Thursday or Friday at 10 AM.'],
      },
      deanId:{type:String,required:true}
});

const studentSessionModel = mongoose.model('student_sessions', studentSessionSchema);

module.exports = studentSessionModel;