// backend/server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
require("./db"); // Ensure your database connection is established

const authRoutes = require("./routes/auth");
const testRoutes = require("./routes/test"); // <--- ADD THIS LINE

const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads")); // Serve uploads statically

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes); 

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend working!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});