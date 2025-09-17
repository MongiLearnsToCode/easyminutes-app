import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

console.log("Creating Better Auth handler");
const { POST, GET } = toNextJsHandler(auth);
console.log("Better Auth handler created");

const originalGET = GET;
const loggedGET = async (request: Request) => {
  console.log("GET request received:", request.url);
  try {
    const result = await originalGET(request);
    console.log("GET request completed");
    return result;
  } catch (error) {
    console.error("GET request error:", error);
    throw error;
  }
};

export { POST };
export { loggedGET as GET };