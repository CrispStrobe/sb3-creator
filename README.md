# SB3 Creator

This project converts a custom pseudocode language into a downloadable Scratch 3.0 (`.sb3`) project file. It's built with React and Vite.

## 🚀 Quickstart

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

---

## 🌐 Deployment

### Vercel (Recommended)

1.  **Push to GitHub**: Create a new repository on GitHub and push your code.
2.  **Import to Vercel**: Log in to your Vercel account, choose "Add New... -> Project", and select your GitHub repository.
3.  **Deploy**: Vercel will automatically detect the correct settings for a Vite project. Click "Deploy".

### GitHub Pages

1.  **Update `package.json`**:
    Open `package.json` and edit the `homepage` field to match your GitHub Pages URL format:
    ```json
    "homepage": "https://crispstrobe.github.io/sb3-creator/",
    ```

2.  **Run the Deploy Script**:
    In your terminal, run the following command:
    ```bash
    npm run deploy
    ```
    This will build the project and deploy it to the `gh-pages` branch on your repository.

3.  **Enable GitHub Pages**:
    In your GitHub repository settings, navigate to the "Pages" section and set the source to deploy from the `gh-pages` branch.