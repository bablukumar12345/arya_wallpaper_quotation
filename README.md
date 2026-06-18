ARYA WALLPAPER — Quotation Management System

Live Link  : https://aryawallpaper.netlify.app
Built by   : Bablu Kumar (requested by Pawan Kumar, Arya Wallpaper)
Purpose    : Professional wallpaper quotation and billing web app


PROJECT OVERVIEW

Arya Wallpaper Quotation System is a mobile-friendly web application
built for wallpaper dealers and installers. It allows you to create
professional customer quotations, calculate square footage from wall
measurements in inches, apply per sq ft pricing, and generate a
downloadable bill — all in real time, directly in the browser.

No internet required after loading. No backend. No database.
Everything runs in a single HTML file.


FEATURES

Customer Details
- Customer Name, Phone Number, Address
- Quote Number and Auto Date

Room Management
- Add multiple rooms per quotation
- Supported rooms: Living Room, Children Room, Bedroom,
  Master Bedroom, Drawing Room, Dining Room, Study Room, Guest Room

Wall-wise Measurement
- Each room supports Wall 1 to Wall 4
- Input: Width and Height in Inches
- Auto calculates Square Feet instantly
- Pattern Number field per wall (e.g. WP-2024)
- Rate (Rs. per Sq Ft) per wall
- Per-wall amount shown in real time

Paper Quality — 13 Types (tap to select)
- Non Woven, Matt Lamination, Premium Glitter, Premium Stroke
- Canvas Paper, Canvas Fabric, Premium Non Woven, PVC Paper
- HD Paper, Leather Texture, Ivory Weave
- Embossed Non Woven, Jointless Non Woven

Billing and Summary
- Room-wise total area and amount
- Grand Total in Rs.
- Advance Paid input
- Balance Due (auto calculated)

Bill Preview and Download
- Professional bill with company logo and name
- Customer info, date, room-wise table
- Payment Terms section
- Download or Print as PDF

Quote History
- Save quotes in browser storage
- Load or delete any previous quote anytime


CALCULATION FORMULA

Square Feet  =  (Width in inches x Height in inches) / 144
Wall Amount  =  Square Feet x Rate per Sq Ft
Room Total   =  Sum of all wall amounts in that room
Grand Total  =  Sum of all room totals
Balance Due  =  Grand Total - Advance Paid


TECH STACK

HTML5       Page structure
CSS3        Styling, card layout, chip buttons, animations
JavaScript  Logic, real-time calculation, localStorage
Netlify     Free static hosting
Print API   PDF / print bill download


HOW TO DEPLOY ON NETLIFY

1. Save the file as index.html
2. Go to netlify.com
3. Click "Add new site" then "Deploy manually"
4. Drag and drop the index.html file
5. Your app goes live instantly with a public URL


FILE STRUCTURE

index.html   Single file app — HTML, CSS, and JS all in one file


BUSINESS INFO

Business   : Arya Wallpaper
Owner      : Pawan Kumar
Website    : https://aryawallpaper.netlify.app
Type       : Private — Built for business use only


This app was designed and developed as a custom tool for
Arya Wallpaper to simplify daily quotation and billing work.
