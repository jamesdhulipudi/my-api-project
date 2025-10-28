import { bootstrapApplication } from '@angular/platform-browser';
// FIX: Changed './app/app.component' to the correct './app/app' 
// based on your local file structure (app.ts)
import { App } from './app/app'; 
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

// The configuration object for your application
const appConfig: ApplicationConfig = {
  // Providers configure services and features for the whole app
  providers: [
    // 1. ZONOLESS CONFIGURATION: REMOVED the conflicting provideZoneChangeDetection call.
    // Since you answered "Yes" to the zoneless prompt during 'ng new', 
    // the project is already configured for zoneless mode, and this line caused the 'enabled' error.
    
    // Include necessary modules/features for your app
    importProvidersFrom(CommonModule),
    provideHttpClient(),
    provideClientHydration() // Required after running 'ng add @angular/ssr'
  ]
};

// Start the application using your main App component and the zoneless configuration
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
