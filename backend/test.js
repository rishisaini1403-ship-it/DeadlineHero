const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://rishisaini1403_db_user:Harish123456@hackathonproject.iyx1tqv.mongodb.net/deadlinehero?retryWrites=true&w=majority&appName=HackathonProject"
)
.then(() => {
  console.log("✅ Connected");
  process.exit(0);
})
.catch(err => {
  console.error(err);
  process.exit(1);
});