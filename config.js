const firebaseConfig = {
  apiKey: "AIzaSyACwPAzBK_TFOyIuuI0iNzy_9zW-CKA7m4",
  authDomain: "shunt-queue.firebaseapp.com",
  databaseURL: "https://console.firebase.google.com/project/shunt-queue/database/shunt-queue-default-rtdb/data/~2F",
  projectId: "shunt-queue",
  storageBucket: "shunt-queue.appspot.com",
  messagingSenderId: "773776993625",
  appId: "1:773776993625:web:2082ee7a38be041bee7048"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
