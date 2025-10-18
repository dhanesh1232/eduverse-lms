const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const portfinder = require("portfinder");

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const courseRoutes = require("./routes/courses");
const assignmentRoutes = require("./routes/assignments");
const materialRoutes = require("./routes/materials");
const discussionRoutes = require("./routes/discussions");

// Config
dotenv.config();
const app = express();

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database connection
const connectDB = require("./config/db");

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/discussions", discussionRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client", "build", "index.html"));
  });
}

// Dynamic port configuration with automatic port finding
const startServer = async () => {
  await connectDB();
  try {
    // Set base port from environment or default to 62000
    const basePort = process.env.PORT ? parseInt(process.env.PORT) : 62000;

    // Find an available port starting from basePort
    portfinder.setBasePort(basePort);
    const availablePort = await portfinder.getPortPromise();

    const server = app.listen(availablePort, () => {
      const actualPort = server.address().port;
      console.log(`🚀 Server running on port ${actualPort}`);
      console.log(`📚 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 Backend URL: http://localhost:${actualPort}`);

      // Save the actual port to a file for the frontend to read
      const fs = require("fs");
      const portConfig = { backendPort: actualPort };
      const portConfigPath = path.resolve(
        __dirname,
        "../client/public/port-config.json"
      );
      fs.writeFileSync(portConfigPath, JSON.stringify(portConfig, null, 2));
      console.log(`💾 Port configuration saved to ${portConfigPath}`);
    });

    // Graceful shutdown handling
    process.on("SIGTERM", () => {
      console.log("SIGTERM received, shutting down gracefully");
      server.close(() => {
        console.log("Server closed");
        mongoose.connection.close();
      });
    });

    process.on("SIGINT", () => {
      console.log("SIGINT received, shutting down gracefully");
      server.close(() => {
        console.log("Server closed");
        mongoose.connection.close();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Error starting server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
