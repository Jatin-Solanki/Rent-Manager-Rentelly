
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signIn(email: string, password: string) {
    try {
      console.log("Attempting to sign in:", email);
      
      // Try to authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log("Firebase authentication successful for:", user.uid);
      
      // Check if the user has a document in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      // If no document exists, create one rather than preventing login
      if (!userDoc.exists()) {
        console.log("User authenticated but no Firestore document found, creating one");
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          createdAt: new Date(),
          userId: user.uid
        });
      }
      
      // Remove the login successful toast
      // Commented out to remove the login popup message
      // toast({
      //   title: "Login successful",
      //   description: "Welcome to Rent Roost!",
      // });
    } catch (error) {
      console.error("Login error:", error);
      
      let errorMessage = "Invalid email or password. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("user-not-found")) {
          errorMessage = "This email is not registered in our system.";
        } else if (error.message.includes("wrong-password")) {
          errorMessage = "Incorrect password. Please try again.";
        }
      }
      
      toast({
        variant: "destructive",
        title: "Login failed",
        description: errorMessage,
      });
      throw error;
    }
  }

  async function signOut() {
    try {
      await firebaseSignOut(auth);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
      throw error;
    }
  }

  async function resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Password reset email sent",
        description: "Please check your email for the password reset link.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: "Failed to send password reset email. Please check if the email is correct.",
      });
      throw error;
    }
  }

  const value = {
    currentUser,
    loading,
    signIn,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
