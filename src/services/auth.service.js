import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase.config';

const authService = {
  signInWithGoogle: () => signInWithPopup(auth, googleProvider),

  signOut: () => signOut(auth),

  onAuthStateChanged: (callback) => onAuthStateChanged(auth, callback),

  getCurrentUser: () => auth.currentUser,

  getIdToken: async () => {
    const user = auth.currentUser;
    if (user) return user.getIdToken();
    return null;
  },
};

export default authService;
