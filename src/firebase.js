// src/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDkG4EbCa92iNOn-vnl-2upOpK2Dj_xi8c",
  authDomain: "ai-smartfarm.firebaseapp.com",
  projectId: "ai-smartfarm",
  storageBucket: "ai-smartfarm.firebasestorage.app",
  messagingSenderId: "53920312936",
  appId: "1:53920312936:web:99fcd2b308bd6f159d95dd"
};

// 初始化
const app = initializeApp(firebaseConfig);

// 🔥 Firestore（你之後會用這個存資料）
export const db = getFirestore(app);