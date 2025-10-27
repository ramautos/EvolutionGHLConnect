import { storage } from "./storage";
import bcrypt from "bcryptjs";

async function resetAdminPassword() {
  const newPassword = "Bonoman18";
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);
  
  const user = await storage.getUserByEmail("ray@ramautos.do");
  if (!user) {
    console.error("Admin user not found");
    process.exit(1);
  }
  
  await storage.updateUser(user.id, { passwordHash });
  console.log("✅ Password reset successfully for ray@ramautos.do");
  console.log("New password: Bonoman18");
  process.exit(0);
}

resetAdminPassword();
