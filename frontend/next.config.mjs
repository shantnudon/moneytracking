/** @type {import('next').NextConfig} */

import path from "path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve("../.env"),
});

const nextConfig = {
  reactCompiler: true,
};

export default nextConfig;
