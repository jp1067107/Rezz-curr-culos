import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, collection, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ResumeData } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth();

// Setup global error handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Ensure the connection is valid
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error.message && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// Utilities for Auth
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  // Ensure we don't try to use redirect in iframes as it often fails to return state
  provider.setCustomParameters({ prompt: 'select_account' });
  
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google", error);
    
    let userFriendlyMessage = "Erro ao fazer login com Google.";
    
    if (error.code === 'auth/popup-blocked') {
      userFriendlyMessage = "O popup de login foi bloqueado pelo seu navegador. Por favor, permita popups para este site.";
    } else if (error.code === 'auth/cancelled-popup-request') {
      userFriendlyMessage = "O login foi cancelado.";
    } else if (error.code === 'auth/popup-closed-by-user') {
      userFriendlyMessage = "A janela de login foi fechada antes de completar o processo.";
    } else if (error.code === 'auth/unauthorized-domain') {
       userFriendlyMessage = `ATENÇÃO: Este domínio (${window.location.hostname}) não está autorizado no Firebase.\n\nPara consertar:\n1. Acesse o Firebase Console\n2. Vá em Authentication > Settings > Authorized domains\n3. Adicione o domínio: ${window.location.hostname}`;
    } else {
      userFriendlyMessage += " " + (error.message || "");
    }

    alert(userFriendlyMessage + "\n\nDICA: Se estiver usando o Safari ou iOS, tente abrir o app em uma nova aba para evitar restrições de iframe.");
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

// Utilities for Resumes
export interface ResumeDoc {
  id: string; // The Firestore document ID
  ownerId: string;
  data: ResumeData;
  createdAt: any;
  updatedAt: any;
  afiliadoOrigem?: string | null;
  sessionId?: string | null;
  statusPagamento?: string;
}

export const saveResume = async (userId: string, resumeId: string, resumeData: ResumeData) => {
  const path = `users/${userId}/resumes/${resumeId}`;
  try {
    const docRef = doc(db, 'users', userId, 'resumes', resumeId);
    
    const afiliadoOrigem = localStorage.getItem('cakto_aff_code') || null;
    let sessionId = localStorage.getItem('resume_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('resume_session_id', sessionId);
    }

    // Check if it exists
    const snap = await getDocFromServer(docRef);
    if (snap.exists()) {
      await updateDoc(docRef, {
        data: resumeData as any,
        updatedAt: serverTimestamp(),
        afiliadoOrigem: afiliadoOrigem,
        sessionId: sessionId
      });
    } else {
      await setDoc(docRef, {
        ownerId: userId,
        data: resumeData as any,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        afiliadoOrigem: afiliadoOrigem,
        sessionId: sessionId,
        statusPagamento: 'pendente'
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const loadResumes = async (userId: string): Promise<ResumeDoc[]> => {
  const path = `users/${userId}/resumes`;
  try {
    const q = query(collection(db, 'users', userId, 'resumes'), where('ownerId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ResumeDoc));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};
