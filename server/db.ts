import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Configure WebSocket for Neon database connection (required for serverless)
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL?.trim(),
  max: 5, // Minimal connections for performance
  min: 1, // Just 1 minimum connection 
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 5000, // 5 second timeout
});

export const db = drizzle({ client: pool, schema });

async function initializeDatabase() {
  console.log("Database initialized successfully");

  try {
    // Check if admin user exists by username or email
    const existingByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@admin.com"))
      .limit(1);
    const existingByUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, "admin"))
      .limit(1);

    if (existingByEmail.length === 0 && existingByUsername.length === 0) {
      // Import the password hashing function from auth.ts for consistency
      const { scrypt, randomBytes } = await import("crypto");
      const { promisify } = await import("util");
      const scryptAsync = promisify(scrypt);

      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync("admin123", salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;

      await db.insert(users).values({
        email: "admin@admin.com",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        username: "admin",
        role: "admin",
        isActive: true,
        // Make sure you include created_at if you intend to set it manually
        createdAt: new Date(), // Assuming you want to set it now
        // If you have an updated_at column, make sure to include it as well
        updatedAt: new Date(), // Uncomment this line if you have such a column
      });
      console.log(
        "Default admin user created - Email: admin@admin.com, Password: admin123",
      );
    } else {
      console.log("Admin user already exists - skipping creation");
    }
  } catch (error: any) {
    // Only log error if it's not about duplicate key or user already existing
    if (
      error.code === "23505" ||
      error.message.includes("duplicate") ||
      error.message.includes("already exists")
    ) {
      console.log("Admin user already exists - skipping creation");
    } else {
      console.error("Error creating default admin user:", error);
    }
  }

  // No sample data creation - only admin user and empty tables

  return db;
}

initializeDatabase();
