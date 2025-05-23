// Polyfills must come before any other imports
import "react-native-url-polyfill/auto";
import {
    ReadableStream,
    WritableStream,
    TransformStream,
} from "web-streams-polyfill";
import "react-native-get-random-values";

// Initialize polyfills before React initialization
if (typeof global.ReadableStream === "undefined") {
    Object.assign(global, {
        ReadableStream,
        WritableStream,
        TransformStream,
    });
}

// Register the app
import { registerRootComponent } from "expo";
import App from "./App";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
