const config = {
  apiKey: 'AIzaSyAYE7l5D5o4vMFQszlqcnN82wWCpTyieqE',
  authDomain: 'bwt1-243d7.firebaseapp.com',
  databaseURL: 'https://bwt1-243d7-default-rtdb.firebaseio.com/',
  projectId: 'bwt1-243d7',
  storageBucket: 'bwt1-243d7.firebasestorage.app',
  messagingSenderId: '535865314375',
  appId: '1:535865314375:web:0a0fb5c2a62be1da143562'
}; 

function ready() {
  return Boolean(
    config.apiKey &&
    config.authDomain &&
    config.databaseURL &&
    config.projectId &&
    config.appId
  );
}

export { config, ready };
