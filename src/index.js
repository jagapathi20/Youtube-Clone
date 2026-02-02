import { loadEnvFile } from 'node:process';
import connectDB from "./db/index.js";

loadEnvFile()
connectDB()