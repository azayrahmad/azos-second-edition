# Clippy App

## Purpose

The Clippy app provides an interactive and engaging way for users to learn about Aziz Rahmad's resume and professional background. It features the classic Microsoft Office Assistant, which can answer natural language questions about skills, experience, education, and projects.

## Key Features

- **Interactive AI Assistant**: A fully animated Clippy character that responds to user questions with spoken answers and expressive animations.
- **Resume Q&A**: Powered by a custom API, the assistant can answer questions like "What are your technical skills?" or "Tell me about your work experience."
- **Text-to-Speech**: Clippy's responses are read aloud using the browser's built-in voice synthesis.
- **Agent Selection**: Users can switch between different agents, such as "Clippy" and "Genius."
- **Context Menu**: Right-clicking on the agent provides quick access to actions like asking a question, triggering a random animation, or closing the app.

## How to Use

1.  **Launch Clippy**: Double-click the "Assistant" icon on the desktop to make Clippy appear.
2.  **Ask a Question**: Click on Clippy to open the input balloon, type your question, and press Enter.
3.  **Interact**: Right-click on Clippy to open the context menu and explore other options.

## Technologies Used

- **AI and Backend**:
  - **Resume Chat API**: A custom API that processes natural language questions and returns structured responses with answer text and animation cues.
- **Frontend**:
  - **Clippy.js**: The core library for rendering the animated agent.
  - **Web Speech API**: For text-to-speech functionality.
  - **jQuery**: Used for DOM manipulation and animations.
  - **os-gui**: The UI component library for windows and menus.
