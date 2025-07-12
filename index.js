import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import App from './App';

// Log platform for debugging
console.log('Platform in index.js:', Platform.OS || 'web');

// Register the app
registerRootComponent(App);

// Ensure default export for Expo rendering
export default App;