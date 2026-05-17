# Video Files

Place your video files here with the following naming convention:

## Preview Videos (10 seconds)
- `course1-preview.mp4`
- `course2-preview.mp4`
- `course3-preview.mp4`

## Full Videos
- `course1-full.mp4`
- `course2-full.mp4`
- `course3-full.mp4`

## Creating Preview Clips

If you have full videos and need to create 10-second previews, use ffmpeg:

```bash
ffmpeg -i course1-full.mp4 -t 10 -c copy course1-preview.mp4
```

Or to re-encode for better compatibility:

```bash
ffmpeg -i course1-full.mp4 -t 10 -c:v libx264 -c:a aac course1-preview.mp4
```
