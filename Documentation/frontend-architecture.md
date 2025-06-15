# Frontend Architecture Documentation

## Component Overview

### Core Components

1. **App.jsx**
   - **Location**: `/src/App.jsx`
   - **Purpose**: The root component that sets up routing and global providers.
   - **Key Features**:
     - Configures React Router
     - Wraps the app with AuthProvider and ThemeProvider
     - Defines public and private routes

2. **MainLayout.jsx**
   - **Location**: `/src/components/MainLayout.jsx`
   - **Purpose**: Main layout wrapper that includes Navigation and renders child routes.
   - **Key Features**:
     - Consistent layout structure
     - Includes Navigation component
     - Uses React Router's Outlet for child routes

3. **Navigation.jsx**
   - **Location**: `/src/components/Navigation.jsx`
   - **Purpose**: Main navigation bar for the application.
   - **Key Features**:
     - Responsive design
     - Theme toggle
     - Authentication-aware UI
     - Branding/logo

### Authentication Components

4. **AuthContext.jsx**
   - **Location**: `/src/contexts/AuthContext.jsx`
   - **Purpose**: Manages authentication state and methods.
   - **Key Features**:
     - Firebase integration
     - User state management
     - Login/logout functionality

5. **PrivateRoute.jsx**
   - **Location**: `/src/components/PrivateRoute.jsx`
   - **Purpose**: Protects routes requiring authentication.
   - **Key Features**:
     - Redirects unauthenticated users
     - Preserves intended destination

### Theme Components

6. **ThemeContext.jsx**
   - **Location**: `/src/contexts/ThemeContext.jsx`
   - **Purpose**: Manages theme state (light/dark mode).
   - **Key Features**:
     - Theme state management
     - Theme toggle functionality
     - Persistent theme preference

7. **ThemeToggle.jsx**
   - **Location**: `/src/components/ThemeToggle.jsx`
   - **Purpose**: Toggles between light and dark themes.
   - **Key Features**:
     - Visual theme indicator
     - Toggle switch with icons

### Page Components

8. **LoginPage.jsx**
   - **Location**: `/src/pages/LoginPage.jsx`
   - **Purpose**: Handles user authentication.
   - **Key Features**:
     - Login form
     - Error handling
     - Google authentication

9. **SignupPage.jsx**
   - **Location**: `/src/pages/SignupPage.jsx`
   - **Purpose**: Handles new user registration.
   - **Key Features**:
     - Registration form
     - Form validation
     - Error handling

10. **DashboardPage.jsx**
    - **Location**: `/src/pages/DashboardPage.jsx`
    - **Purpose**: Main dashboard for authenticated users.
    - **Key Features**:
      - Displays user content
      - Placeholder for file management
      - Protected route

## Component Hierarchy

```mermaid
flowchart TD
    A["App.jsx"] --> B["AuthProvider"]
    A --> C["ThemeProvider"]
    A --> D["BrowserRouter"]
    
    D --> E["Routes"]
    
    E --> F["Route path='/' element={<MainLayout />}"]
    F --> G["Route index element={<Navigate to='/login' replace />}"]
    F --> H["Route path='login' element={<LoginPage />}"]
    F --> I["Route path='signup' element={<SignupPage />}"]
    F --> J["Route path='dashboard' element={
      <PrivateRoute>
        <DashboardPage />
      </PrivateRoute>
    }"]
    
    MainLayout --> Navigation
    MainLayout --> Outlet
    
    Navigation --> ThemeToggle
    Navigation --> AuthContext
    
    LoginPage --> AuthContext
    SignupPage --> AuthContext
    DashboardPage --> AuthContext
    
```

## Data Flow

1. **Authentication Flow**:
   - User enters credentials in LoginPage/SignupPage
   - AuthContext handles Firebase authentication
   - On success, user is redirected to dashboard
   - Navigation updates to show authenticated state

2. **Theme Flow**:
   - ThemeToggle component triggers theme changes
   - ThemeContext updates the theme state
   - All subscribed components re-render with new theme

3. **Routing Flow**:
   - Unauthenticated users are redirected to login
   - Authenticated users can access protected routes
   - Navigation updates based on current route

## Best Practices

1. **Component Structure**:
   - Keep components small and focused
   - Use context for global state
   - Follow container/component pattern

2. **Styling**:
   - Use Bootstrap's utility classes
   - Maintain consistent spacing
   - Ensure accessibility

3. **State Management**:
   - Use context for global states
   - Keep local state in components when possible
   - Avoid prop drilling

## Future Improvements

1. Add loading states for better UX
2. Implement error boundaries
3. Add more comprehensive form validation
4. Enhance mobile responsiveness
5. Add unit tests for components