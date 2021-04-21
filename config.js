import * as firebase from 'firebase'
require("@firebase/firestore")
  // Your web app's Firebase configuration
  var firebaseConfig = {
    apiKey: "AIzaSyAdpuYMRenH4wlT2imaT8kkjnkjXLnEpco",
    authDomain: "wily-4a77d.firebaseapp.com",
    databaseURL : "https://wily-4a77d.firebaseio.com",
    projectId: "wily-4a77d",
    storageBucket: "wily-4a77d.appspot.com",
    messagingSenderId: "784419374393",
    appId: "1:784419374393:web:14149ee50897ea87cf54e8"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  export default firebase.firestore()