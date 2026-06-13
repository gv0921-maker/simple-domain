# Notification Sounds

Drop the following royalty-free MP3 files here to override the Web Audio API
fallback used by `src/lib/notifications/sound.ts`:

- `chat-notification.mp3` — short, light tone for chat messages
- `general-notification.mp3` — neutral tone for workflow notifications
- `urgent.mp3` — attention-grabbing tone for urgent priority alerts

If a file is missing or fails to play, the app automatically falls back to a
short generated beep using the Web Audio API, so the system works without any
audio assets present.
