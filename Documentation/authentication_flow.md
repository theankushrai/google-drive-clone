```mermaid
graph LR
    subgraph Client-side
        A[Frontend Web App]
    end

    subgraph Authentication Service
        B[Firebase Auth Service]
    end

    subgraph Your Server
        C["Backend API (Flask/Lambda)"]
    end

    A -- 1. User Login (Email/Pass) --> B
    B -- 1a. Returns ID Token (JWT) --> A

    A -- 2. Protected Request (with Authorization: Bearer Token) --> C

    C -- 3. Verify Token (using Firebase Admin SDK) --> B
    B -- 3a. Token Valid / Invalid Status --> C

    C -- 4. Serve Data / Error Response --> A
    