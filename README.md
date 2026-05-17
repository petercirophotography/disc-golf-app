# Disc Golf Course Walkthroughs

A React application for hosting video walkthroughs of disc golf courses with 10-second previews and paywall functionality.

## Features

- Browse disc golf courses with thumbnails and details
- 10-second video previews
- Paywall overlay after preview ends
- Purchase full course access
- Responsive design

## Setup

```bash
cd disc-golf-app
npm install
npm run dev
```

## Structure

- `/src/components` - React components (CourseList, CourseDetail)
- `/src/data` - Course data
- Video preview automatically stops at 10 seconds
- Purchase unlocks full video playback

## Next Steps

1. Replace placeholder video URLs with actual course videos
2. Integrate payment processor (Stripe, PayPal)
3. Add user authentication
4. Store purchases in database
5. Add video hosting (AWS S3, Cloudflare Stream)
