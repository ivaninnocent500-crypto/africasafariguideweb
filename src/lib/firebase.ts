import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// TEMPORARY: Hardcoded values and debug log to test the connection
console.log("Testing API Key:", "AIzaSyCqophKvhVvuUXLdGCDRxJo71fpVizX6v4");

const app = initializeApp({
  apiKey: "AIzaSyCqophKvhVvuUXLdGCDRxJo71fpVizX6v4",
  authDomain: "africasafariguide-17321.firebaseapp.com",
  projectId: "africasafariguide-17321",
  appId: "1:96445241780:web:87e1972bb605b19adefae1",
})

export const auth = getAuth(app)
export const db = getFirestore(app)
