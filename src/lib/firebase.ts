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
  try {
    await signInWithPopup(auth, provider);
  } catch (error: any) {
    console.error("Error signing in with Google", error);
    alert("Erro ao fazer login com Google: " + error.message + ".\n\nSe estiver no Safari/iOS ou dentro de um preview, tente abrir o app em uma nova guia/janela.");
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
