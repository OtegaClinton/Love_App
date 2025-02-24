require("dotenv").config();
const express = require("express");
require("./config/db"); 

const userRoutes = require("./routes/userRoute");
const loveRequestRoutes = require("./routes/loveRequestRoute");

const PORT = process.env.PORT || 2015;
const app = express();

app.use(express.json());

// Routes
app.use("/api/v1", userRoutes);
app.use("/api/v1", loveRequestRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Server is listening on PORT: ${PORT}`);
});
