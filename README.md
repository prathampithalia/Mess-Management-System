# Mess Management System

This is a simple web app created for Mess (dining) management. It helps customers and mess owners easily keep track of daily meals, active plans, and cancellations.

---

## Features

### For Students / Users
* **Simple Plans:** Subscribe to a 30-day plan. You can pick either 1 meal a day or 2 meals a day.
* **Delivery Choice:** Choose between "Dine In" or "Home Delivery".
* **Save Missed Meals:** If you are not eating on a specific day, you can cancel your meal. The meal is saved in your account, and your expiry date automatically extends so you never waste your money!
* **Live Dashboard:** Easily see exactly how many meals you have left on your dashboard.

### For Admin
* **All Users List:** See every user, what plan they have, and how many meals are remaining.
* **Manual Override:** Admins can manually mark a user's meal as "Eaten" or "Cancelled" if someone forgets to do it online.
* **Charts:** View simple charts showing new users joining and total meals eaten vs cancelled.
* **Download Data:** Click one button to download the whole database into an Excel-friendly CSV file.

---

## Tech Stack Used

This project uses the famous **MERN Stack**!

* **Frontend:** React.js (with React Router for changing pages) and simple Vanilla CSS.
* **Backend:** Node.js & Express.js for making the API.
* **Database:** MongoDB & Mongoose.
* **Extra Packages:** 
  * `node-cron`: To automatically mark left-over daily meals as "eaten" every midnight.
  * `jsonwebtoken (JWT)`: For secure login and registering.
  * `json2csv`: To easily export the admin data.

---

## How to Run this Project

If you want to test this out on your own computer, follow these simple steps!

### 1. Prerequisites
Make sure you have installed:
* Node.js
* MongoDB (Make sure your MongoDB server is running locally)

### 2. Start the Backend server
1. Open your terminal and go into the `backend` folder.
2. Run `npm install` to download all the required packages.
3. Run `npm run dev` to start the backend. (It usually runs on port 5000).

### 3. Start the Frontend website
1. Open a *new* terminal window and go into the `frontend` folder.
2. Run `npm install` to install React and other libraries.
3. Run `npm run dev` to start the website.
4. Click the local link shown in the terminal (like `http://localhost:5173`) to open the app in your browser!
