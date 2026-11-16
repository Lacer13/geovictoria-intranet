import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      preserveEntrySignatures: false,
      output: {
        strictExecutionOrder: true,
        codeSplitting: {
          groups: [
            {
              name: "firebase-core",
              test: /node_modules[\\/]@firebase[\\/](?:app|util|component|logger)[\\/]/,
              priority: 40,
              includeDependenciesRecursively: false,
            },
            {
              name: "firebase-auth",
              test: /node_modules[\\/]@firebase[\\/]auth[\\/]/,
              priority: 30,
              includeDependenciesRecursively: false,
            },
            {
              name: "firebase",
              test: /node_modules.*(?:@firebase|firebase|protobuf|grpc)/,
              priority: 20,
              includeDependenciesRecursively: false,
            },
            {
              name: "react",
              test: /node_modules.*(?:react-dom|react-router|scheduler|\/react\/)/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
});
