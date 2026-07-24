PUT YOUR POSTER IMAGE HERE
===========================

To show your Freshers Party poster (or any welcome poster) on the student
dashboard, just add your image file to this folder and name it:

    welcome-poster.jpg

(If your image is a PNG instead of JPG, name it welcome-poster.png and
also change the file extension in one line of code — see below.)

Steps:
1. Save/export your poster image (the one made with Nano Banana or any
   other tool) as a .jpg file.
2. Rename it to exactly: welcome-poster.jpg
3. Copy it into this folder: client/public/images/
4. Restart the frontend (Ctrl+C in the client terminal, then `npm run dev`
   again) — or just refresh the browser, since Vite usually picks up new
   public files automatically.
5. Log in as a student — the poster will appear at the very top of the
   dashboard, above everything else.

If you used a PNG file instead of JPG:
- Name the file welcome-poster.png
- Open client/src/pages/StudentDashboard.jsx
- Find this line:
    <img src="/images/welcome-poster.jpg" ...
- Change ".jpg" to ".png"

If no poster file is present, the banner section simply won't show up —
nothing will break.
