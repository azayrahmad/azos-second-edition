# Clippy App

The Clippy app brings back the iconic Microsoft Office Assistant to help users learn about Aziz Rahmad's resume and professional background. This interactive application features the classic paperclip character that can answer questions about skills, experience, education, and projects.

## Features

### 🤖 Interactive Clippy Agent
- Classic Microsoft Office Clippy character with smooth animations.
- Click-to-interact interface for asking questions.
- Context menu with additional options (right-click on Clippy).
- Switch between different agents ("Clippy" and "Genius").

### 💬 Resume Q&A
- Ask natural language questions about Aziz's background.
- Powered by an AI assistant trained on resume data.
- Covers topics like skills, experience, education, and projects.

### 🔊 Text-to-Speech (TTS)
- Voice synthesis for Clippy's responses.
- Automatic voice selection with a preference for natural-sounding English voices.

### 🎭 Animations & Expressions
- Dynamic animations synchronized with speech.
- Different animations for different types of responses (Thinking, Explaining, Waving, etc.).
- Smooth transitions between animation states.

## Usage

### Launching Clippy
1. Double-click the Clippy icon on the desktop.
2. The Clippy character will appear and greet you.
3. Click on Clippy to open the question input window.

### Asking Questions
1. Click on Clippy or use the context menu's "Ask Clippy" option.
2. Type your question in the input field (e.g., "What are Aziz's technical skills?").
3. Press Enter or click "Ask" to submit.
4. Clippy will think, then provide an animated response.

### Context Menu Options
Right-click on Clippy to access:
- **Animate**: Trigger a random animation.
- **Ask Clippy**: Open the question input window.
- **Help**: Get usage instructions.
- **Agent**: Switch between available agents (e.g., Clippy, Genius).
- **Close**: Hide Clippy and close all associated windows.

## Technical Details

### API Integration
The app communicates with `https://resume-chat-api-nine.vercel.app/api/clippy-helper` to process questions and generate responses. Each response includes:
- Answer text.
- An animation type for synchronized character movement.
- Sequential response fragments for a more natural conversation flow.

### Voice Management
- Automatic voice loading and selection via the Web Speech API.
- Fallback handling for voice loading delays.
- A voice preference algorithm to select a suitable default voice.

### Window Management
- A dedicated, non-resizable input window for asking questions.
- Automatic cleanup of windows and event listeners when the app is closed.
- Focus management for a better user experience.

## Example Questions

Try asking Clippy questions like:
- "What programming languages does Aziz know?"
- "Tell me about his work experience"
- "What projects has he worked on?"
- "What is his educational background?"
- "What are his technical skills?"
- "Does he have experience with web development?"

## Dependencies

The Clippy app relies on:
- **clippy.js**: The core Clippy agent library.
- **Web Speech API**: For text-to-speech functionality.
- **jQuery**: For DOM manipulation.
- **os-gui**: The UI component library for windows and menus.
- **Resume Chat API**: For AI-powered Q&A responses.

## Browser Compatibility

- **Text-to-Speech**: Requires a browser with Web Speech API support (e.g., Chrome, Edge, Safari).
- **Fallback**: Gracefully degrades when TTS is unavailable.
- **Voice Loading**: Handles asynchronous voice loading.