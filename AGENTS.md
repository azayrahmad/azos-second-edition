# Agent Instructions for azOS Development

This document provides guidelines for AI agents working on the azOS project.

## Application Configuration

When adding a new application to `src/config/apps.js`, you **must** include a `tips` property in the application's configuration object. This property should be an array of strings, where each string is a helpful tip or trick about the application.

**Example:**

```javascript
{
  id: "new-app",
  title: "New Application",
  icon: "path/to/icon.png",
  tips: ["This is a helpful tip for the new application."],
  // ... other properties
}
```
