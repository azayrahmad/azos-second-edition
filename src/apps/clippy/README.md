# Clippy App

The Clippy app brings back the iconic Microsoft Office Assistant to help users learn about Aziz Rahmad's resume and professional background. This interactive application features the classic paperclip character that can answer questions about skills, experience, education, and projects.

## Features

### 🤖 Interactive Clippy Agent
- Classic Microsoft Office Clippy character with smooth animations
- Click-to-interact interface for asking questions
- Context menu with additional options (right-click on Clippy)

### 💬 Resume Q&A
- Ask natural language questions about Aziz's background
- Powered by an AI assistant trained on resume data
- Questions about skills, experience, education, and projects

### 🔊 Text-to-Speech (TTS)
- Voice synthesis for Clippy's responses
- Customizable voice settings including:
  - Voice selection (male/female, language)
  - Speech rate (speed)
  - Pitch adjustment
  - Volume control
- Automatic voice selection with preference for male English voices

### 🎭 Animations & Expressions
- Dynamic animations synchronized with speech
- Different animations for different types of responses (Thinking, Explaining, Waving, etc.)
- Smooth transitions between animation states

## Usage

### Launching Clippy
1. Double-click the Clippy icon on the desktop
2. The Clippy character will appear and greet you
3. Click on Clippy to open the question input window

### Asking Questions
1. Click on Clippy or use the context menu "Ask Clippy" option
2. Type your question in the input field (e.g., "What are Aziz's technical skills?")
3. Press Enter or click "Ask" to submit
4. Clippy will think, then provide an animated response

### Customizing TTS Settings
1. Right-click on Clippy and select "TTS Settings"
2. Adjust voice parameters:
   - **Voice**: Select from available system voices
   - **Rate**: Speech speed (0.1 = slow, 2.0 = fast)
   - **Pitch**: Voice pitch (0 = low, 2 = high)
   - **Volume**: Speech volume (0% - 100%)
3. Click "Test Voice" to preview settings
4. Click "Save Settings" to apply changes

### Context Menu Options
Right-click on Clippy to access:
- **Animate**: Trigger a random animation
- **Ask Clippy**: Open the question input window
- **Help**: Get usage instructions
- **TTS Settings**: Customize voice settings
- **Close**: Hide Clippy and close all windows

## Technical Details

### API Integration
The app communicates with `https://resume-chat-api-nine.vercel.app/api/clippy-helper` to process questions and generate responses. Each response includes:
- Answer text with markdown formatting removed
- Animation type for synchronized character movement
- Sequential response fragments for natural conversation flow

### Voice Management
- Automatic voice loading and selection
- Fallback handling for voice loading delays
- Voice preference algorithm prioritizing English male voices
- Persistent TTS settings across sessions

### Window Management
- Dedicated input window for questions (300x120px, non-resizable)
- TTS settings window (350x280px, non-resizable)
- Automatic cleanup of windows and event listeners
- Focus management for better UX

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
- **clippy.js**: Core Clippy agent library
- **Web Speech API**: For text-to-speech functionality
- **jQuery**: For DOM manipulation
- **OS GUI Framework**: For window and menu management
- **Resume Chat API**: For AI-powered Q&A responses

## Browser Compatibility

- **Text-to-Speech**: Requires browsers with Web Speech API support (Chrome, Edge, Safari)
- **Fallback**: Graceful degradation when TTS is unavailable
- **Voice Loading**: Handles asynchronous voice loading with timeouts
