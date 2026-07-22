importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDTM6URjh9pdIS3A-Gi4YZ-Lk2WvXo_wio",
  authDomain: "barbearia-santiago-6d0cd.firebaseapp.com",
  projectId: "barbearia-santiago-6d0cd",
  storageBucket: "barbearia-santiago-6d0cd.firebasestorage.app",
  messagingSenderId: "96380770550",
  appId: "1:96380770550:web:d8b97b922fa422ab19b4d7",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title || "Novo Agendamento!";
  const notificationOptions = {
    body: payload.notification.body || "Tens um novo agendamento na barbearia.",
    icon: "/logo.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});