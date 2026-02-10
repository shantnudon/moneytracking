// import dotenv from "dotenv";
// import "dotenv/config";
import { PrismaClient } from "../prisma/generated/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

// logger.info("Initializing PrismaClient with URL: " + process.env.DATABASE_URL);

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: pool });

export default prisma;
