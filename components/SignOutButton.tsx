"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth.action";

const SignOutButton = () => {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setError("");

    try {
      await signOut();
      router.replace("/sign-in");
      router.refresh();
    } catch (signOutError) {
      console.error("Failed to sign out:", signOutError);
      setError("Could not sign out. Please try again.");
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        onClick={handleSignOut}
        disabled={isSigningOut}
        aria-label="Sign out"
      >
        <LogOut aria-hidden="true" />
        {isSigningOut ? "Signing out..." : "Sign out"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default SignOutButton;
