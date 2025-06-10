import { hashPassword } from "../server/auth";

async function generateHash() {
  const hash = await hashPassword("demo1234");
  console.log("Password hash for demo1234:", hash);
}

generateHash();
