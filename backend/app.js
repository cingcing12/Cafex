require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const mongoose = require("mongoose");
const axios = require("axios");
const { Server } = require("socket.io");

// 🟢 IMPORTS
const { BakongKHQR, khqrData, MerchantInfo, IndividualInfo } = require("bakong-khqr");
const TelegramBot = require("node-telegram-bot-api");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require('google-auth-library');
const QRCode = require('qrcode');

// 🟢 CRITICAL: Define upload correctly
const upload = require("./config/cloudinary"); 

// MODELS
const Product = require("./models/Product");
const Category = require("./models/Category"); 
const Order = require("./models/Order"); 
const PendingOrder = require("./models/PendingOrder"); 
const User = require("./models/User");
const Review = require("./models/Review");
const PendingUser = require("./models/PendingUser");
const PendingLogin = require("./models/PendingLogin");
const DeliveryStaff = require("./models/DeliveryStaff");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// 🟢 LOAD KEYS
const BAKONG_TOKEN = process.env.BAKONG_TOKEN;
const MERCHANT_ID = process.env.BAKONG_MERCHANT_ID;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const KEYS_EXIST = !!(BAKONG_TOKEN && MERCHANT_ID && MERCHANT_ID.length > 5);

if (!KEYS_EXIST) console.warn("⚠️  Bakong Keys Missing - KHQR will use Deep Link Fallback");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ DB Error:", err));

const bot = process.env.TELEGRAM_BOT_TOKEN ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false }) : null;

// --- TELEGRAM NOTIFICATIONS ---
const sendTelegramNotification = async (order, type = "NEW ORDER") => {
    if (!bot || !process.env.TELEGRAM_CHAT_ID) return;

    try {
        let staffDetails = null;
        if (order.deliveryStaff) {
            staffDetails = await DeliveryStaff.findById(order.deliveryStaff);
        }

        const itemsText = formatOrderItems(order.items);
        
        let teleLink = "N/A";
        if (order.customer && order.customer.telegramUsername) {
            const cleanUser = order.customer.telegramUsername.replace('@', '').trim();
            teleLink = `[Chat with Customer](https://t.me/${cleanUser})`;
        }

        const staffText = staffDetails 
            ? `\n🚚 *DELIVERY BY:*\n👤 *${staffDetails.name}*\n📞 \`${staffDetails.phone}\`\n🛵 ${staffDetails.vehicleType}`
            : `\n🚚 *DELIVERY:* Pending Assignment`;

        const statusIcon = order.paymentStatus === 'Paid' ? '🟢' : '🔴';

        const msg = `
${type === 'PAID' ? '✅ 💸 *PAYMENT CONFIRMED*' : '📦 *NEW ORDER RECEIVED*'}
➖➖➖➖➖➖➖➖➖➖
🧾 *Bill No:* \`${order.billNumber}\`
💰 *Total:* $${Number(order.amount).toFixed(2)}
${statusIcon} *Status:* ${order.paymentStatus.toUpperCase()}
➖➖➖➖➖➖➖➖➖➖
👤 *CUSTOMER INFO*
Name: ${order.customer.name}
📞: \`${order.customer.phone}\`
📍: ${order.customer.address}
🏢: ${order.landmark || "No landmark"}
🔗: ${teleLink}
➖➖➖➖➖➖➖➖➖➖
🛒 *ORDER DETAILS*
${itemsText}
➖➖➖➖➖➖➖➖➖➖${staffText}
`;

        bot.sendMessage(process.env.TELEGRAM_CHAT_ID, msg, { parse_mode: "Markdown" });
    } catch (e) {
        console.error("Telegram Error:", e.message);
    }
};

// --- EMAIL TRANSPORTER ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: "cing16339@gmail.com", pass: "qsjo mjyg ambn zjlk" },
});

const formatOrderItems = (items) => {
    return items.map(i => {
        let optionsStr = "";
        if (i.options && Array.isArray(i.options) && i.options.length > 0) {
            optionsStr = `\n   └ 🔸 _${i.options.map(o => typeof o === 'object' ? o.name : o).join(', ')}_`;
        } else if (i.variant) {
            optionsStr = `\n   └ 🔸 _${i.variant}_`;
        }
        
        return `- ${i.quantity}x *${i.name}* ${i.isReward ? '🎁' : ''} ($${i.price})${optionsStr}`;
    }).join("\n");
};

// ============================================
// 🟢 HELPER: ASSIGN DRIVER & NOTIFY
// ============================================
const assignDriverAndNotify = async (staffId, orderDetails) => {
    if (!staffId) return;
    try {
        const staff = await DeliveryStaff.findByIdAndUpdate(staffId, { status: "Busy" });
        io.emit("staff-status-changed", { id: staffId, status: "Busy" });

        if (staff && staff.email) {
            const teleLink = orderDetails.customer.telegramUsername 
                ? `https://t.me/${orderDetails.customer.telegramUsername.replace('@', '')}` 
                : "#";
            
            const dashboardLink = "http://localhost:5173/#/delivery/tasks"; 

            const itemsHtml = orderDetails.items.map(i => {
                const opts = (i.options && i.options.length) ? `<br><small style="color:#666;">+ ${Array.isArray(i.options) ? i.options.join(', ') : i.options}</small>` : '';
                return `
                <div style="border-bottom: 1px solid #eee; padding: 8px 0;">
                    <span style="font-weight:bold;">${i.quantity}x</span> ${i.name} <span style="float:right;">$${i.price}</span>
                    ${opts}
                </div>`;
            }).join('');

            const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; color: #1f2937; margin: 0; }
                    .container { max-width: 500px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden; }
                    .header { background: #111827; padding: 20px; text-align: center; color: #fff; }
                    .content { padding: 25px; }
                    .btn { display: block; width: 100%; text-align: center; background: #2563eb; color: #fff; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
                    .info-box { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
                    .label { font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: bold; display: block; }
                    .val { font-size: 14px; font-weight: 600; color: #111827; display:block; margin-bottom:5px;}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>📦 New Delivery Task</h2>
                        <p>Order #${orderDetails.billNumber}</p>
                    </div>
                    <div class="content">
                        <div class="info-box">
                            <span class="label">Customer</span>
                            <span class="val">${orderDetails.customer.name}</span>
                            <span class="label">Phone</span>
                            <span class="val"><a href="tel:${orderDetails.customer.phone}">${orderDetails.customer.phone}</a></span>
                            <span class="label">Address</span>
                            <span class="val">${orderDetails.customer.address}</span>
                            <span class="label">Landmark</span>
                            <span class="val">${orderDetails.landmark || '-'}</span>
                        </div>

                        <div class="info-box">
                            <span class="label" style="margin-bottom:10px;">Order Summary</span>
                            ${itemsHtml}
                            <div style="margin-top:10px; text-align:right; font-weight:bold;">
                                Total: $${Number(orderDetails.amount).toFixed(2)}
                            </div>
                        </div>

                        <div style="text-align: center; margin-top: 15px;">
                            <a href="${teleLink}" style="color: #2563eb; text-decoration: none; font-weight: bold;">💬 Chat with Customer</a>
                        </div>

                        <a href="${dashboardLink}" class="btn">🚀 OPEN DRIVER APP</a>
                    </div>
                </div>
            </body>
            </html>
            `;
            
            await transporter.sendMail({
                from: '"CafeX Dispatch" <dispatch@cafex.com>',
                to: staff.email,
                subject: `🚀 New Task: ${orderDetails.customer.address.substring(0, 20)}...`,
                html: emailHtml
            });
            console.log(`✅ Email sent to driver: ${staff.email}`);
        }
    } catch (e) { console.error("Driver Notify Error:", e.message); }
};

// ============================================
// 🟢 PROFESSIONAL EMAIL TEMPLATE
// ============================================
const getEmailTemplate = (otp, type) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f7; color: #51545E; margin: 0; padding: 0; }
            .email-wrapper { width: 100%; background-color: #f4f4f7; padding: 20px 0; }
            .email-content { max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; }
            .email-header { background-color: #111827; padding: 30px; text-align: center; }
            .email-header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px; }
            .email-body { padding: 40px 30px; text-align: center; }
            .email-body h2 { font-size: 20px; font-weight: 700; color: #333; margin-bottom: 10px; }
            .email-body p { font-size: 15px; color: #6b7280; line-height: 1.5; margin-bottom: 25px; }
            .otp-box { display: inline-block; background-color: #f3f4f6; padding: 15px 30px; border-radius: 8px; font-size: 32px; font-weight: 900; letter-spacing: 5px; color: #111827; margin-bottom: 25px; border: 2px dashed #e5e7eb; }
            .email-footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
            .warning-text { font-size: 13px; color: #ef4444; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="email-wrapper">
            <div class="email-content">
                <div class="email-header">
                    <h1>CAFE<span style="color: #fbbf24;">X</span></h1>
                </div>
                
                <div class="email-body">
                    <h2>${type} Verification</h2>
                    <p>Use the code below to complete your ${type.toLowerCase()} request. This code will expire in 5 minutes.</p>
                    
                    <div class="otp-box">${otp}</div>
                    
                    <p class="warning-text">If you did not request this code, please ignore this email or contact support.</p>
                </div>

                <div class="email-footer">
                    <p>&copy; ${new Date().getFullYear()} CafeX. All rights reserved.</p>
                    <p>Phnom Penh, Cambodia</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};

// ============================================
// 🟢 NEW: CONTACT US ROUTE
// ============================================
app.post("/api/contact", async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: "Name, email, and message are required" });
        }

        // Send Email to the Store Owner (Your Gmail)
        await transporter.sendMail({
            from: `"${name}" <cing16339@gmail.com>`, // Send from authenticated mail
            replyTo: email, // If you hit reply in your inbox, it goes to the customer
            to: "cing16339@gmail.com", // The email receiving the contact messages
            subject: `📧 New Contact Form Submission from ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px; border-radius: 8px;">
                    <h2 style="color: #2563eb; margin-top: 0;">New Message via Website Contact Form</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <h3 style="color: #333;">Message Details:</h3>
                    <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #2563eb; color: #333; line-height: 1.6; border-radius: 4px;">
                        ${message.replace(/\n/g, '<br>')}
                    </div>
                </div>
            `
        });

        res.json({ message: "Message sent successfully!" });

    } catch (e) {
        console.error("Contact Form Error:", e);
        res.status(500).json({ error: "Failed to send message" });
    }
});

// 🟢 Forgot Password Route
app.post("/api/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) return res.status(404).json({ error: "User not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Remove old pending logins/resets
        await PendingLogin.deleteMany({ email });
        
        // Save new OTP
        await new PendingLogin({ email, otp }).save();

        await transporter.sendMail({
            from: '"CafeX Security"',
            to: email,
            subject: "Password Reset Code",
            html: getEmailTemplate(otp, "Password Reset")
        });

        res.json({ message: "OTP Sent" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to send OTP" });
    }
});

// 🟢 Verify Reset Code
app.post("/api/verify-reset-code", async (req, res) => {
    try {
        const { email, otp } = req.body;
        const record = await PendingLogin.findOne({ email });
        
        if (!record || record.otp !== otp) {
            return res.status(400).json({ error: "Invalid Code" });
        }
        
        res.json({ message: "Code Verified" });
    } catch (e) {
        res.status(500).json({ error: "Error verifying code" });
    }
});

// 🟢 Reset Password
app.post("/api/reset-password", async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        
        // Verify OTP again for security
        const record = await PendingLogin.findOne({ email });
        if (!record || record.otp !== otp) {
            return res.status(400).json({ error: "Invalid Code or Expired" });
        }

        // Update User Password
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found" });

        user.password = newPassword;
        await user.save();

        // Cleanup OTP
        await PendingLogin.deleteMany({ email });

        res.json({ message: "Password Updated" });
    } catch (e) {
        res.status(500).json({ error: "Reset Failed" });
    }
});

// 🟢 Request Password Change OTP (Authenticated User)
app.post("/api/request-password-change", async (req, res) => {
    try {
        const { email } = req.body;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await PendingLogin.deleteMany({ email });
        await new PendingLogin({ email, otp }).save();
        
        await transporter.sendMail({
            from: '"CafeX Security"',
            to: email,
            subject: "Verify Password Change",
            html: getEmailTemplate(otp, "Change Password")
        });
        
        res.json({ message: "OTP Sent" });
    } catch (e) {
        res.status(500).json({ error: "Failed" });
    }
});

// 🟢 Verify & Change Password (Authenticated User)
app.post("/api/verify-password-change", async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const record = await PendingLogin.findOne({ email });
        
        if (!record || record.otp !== otp) return res.status(400).json({ error: "Invalid Code" });

        const user = await User.findOne({ email });
        user.password = newPassword;
        await user.save();
        
        await PendingLogin.deleteMany({ email });
        res.json({ message: "Password Updated" });
    } catch (e) {
        res.status(500).json({ error: "Failed" });
    }
});

app.post("/api/google-login", async (req, res) => { 
    try { 
        const { token } = req.body; 
        
        // 🟢 UNCOMMENT THIS IN PRODUCTION (Real Google Verify)
        
        const ticket = await googleClient.verifyIdToken({ 
            idToken: token, 
            audience: GOOGLE_CLIENT_ID 
        }); 
        const { email, name, picture } = ticket.getPayload(); 
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); 
        let user = await User.findOne({ email }); 
        
        if (user) { 
            if (!user.image) { user.image = picture; await user.save(); } 
            await PendingLogin.deleteMany({ email }); 
            await new PendingLogin({ email, otp }).save(); 
            await transporter.sendMail({ from: '"CafeX Security"', to: email, subject: "Login Code", html: getEmailTemplate(otp, "Login") }); 
            return res.json({ requireOtp: true, action: 'login', email }); 
        } else { 
            await PendingUser.findOneAndDelete({ email }); 
            await new PendingUser({ name, email, phone: "", password: "google_" + Date.now(), otp, image: picture }).save(); 
            await transporter.sendMail({ from: '"CafeX Support"', to: email, subject: "Verify Email", html: getEmailTemplate(otp, "Verify") }); 
            return res.json({ requireOtp: true, action: 'register', email }); 
        } 
    } catch (e) { res.status(400).json({ error: "Auth Failed" }); } 
});

app.post("/api/login", async (req, res) => { try { const { email, password } = req.body; const user = await User.findOne({ email }); if (!user || user.password !== password) return res.status(401).json({ error: "Invalid credentials" }); if (user.role === 'admin') { const u = user.toObject(); delete u.password; return res.json({ message: "Success", user: u, requireOtp: false }); } const otp = Math.floor(100000 + Math.random() * 900000).toString(); try { await PendingLogin.deleteMany({ email }); } catch(e){} await new PendingLogin({ email, otp }).save(); await transporter.sendMail({ from: '"CafeX Security"', to: email, subject: "Login Code", html: getEmailTemplate(otp, "Login Code") }); res.json({ message: "OTP Sent", requireOtp: true }); } catch (e) { res.status(500).json({ error: "Error" }); } });
app.post("/api/verify-login-otp", async (req, res) => { try { const { email, otp } = req.body; const record = await PendingLogin.findOne({ email }); if (!record || record.otp !== otp) return res.status(400).json({ error: "Invalid Code" }); const user = await User.findOne({ email }, "-password"); await PendingLogin.deleteOne({ email }); res.json({ message: "Success", user }); } catch (e) { res.status(500).json({ error: "Error" }); } });
app.post("/api/send-otp", async (req, res) => { try { const { name, email, phone, password } = req.body; if (await User.findOne({ email })) return res.status(400).json({ error: "Email exists" }); const otp = Math.floor(100000 + Math.random() * 900000).toString(); await PendingUser.findOneAndDelete({ email }); await new PendingUser({ name, email, phone, password, otp }).save(); await transporter.sendMail({ from: '"CafeX Support"', to: email, subject: "Verify Email", html: getEmailTemplate(otp, "Verify Code") }); res.json({ message: "OTP sent" }); } catch (e) { res.status(500).json({ error: "Email failed" }); } });
app.post("/api/verify-otp", async (req, res) => { try { const { email, otp } = req.body; const pending = await PendingUser.findOne({ email }); if (!pending || pending.otp !== otp) return res.status(400).json({ error: "Invalid Code" }); const newUser = new User({ name: pending.name, email: pending.email, phone: pending.phone, password: pending.password, role: "customer", image: pending.image || "", points: 0 }); await newUser.save(); await PendingUser.deleteOne({ email }); res.json({ message: "Verified", user: newUser }); } catch (e) { res.status(500).json({ error: "Error" }); } });

// ============================================
// 📦 STANDARD DATA ROUTES
// ============================================
app.get("/api/users", async (req, res) => { try { const users = await User.find({}, "-password"); res.json(users); } catch (e) { res.status(500).json({ error: "Error" }); } });
app.put("/api/user/profile/:id", upload.single('image'), async (req, res) => { try { const { name, email, phone } = req.body; let user = await User.findById(req.params.id); if (!user) return res.status(404).json({ error: "Not Found" }); if(name) user.name = name; if(email) user.email = email; if(phone) user.phone = phone; if(req.file) user.image = req.file.path; await user.save(); const u = user.toObject(); delete u.password; res.json({ message: "Updated", user: u }); } catch (e) { res.status(500).json({ error: "Error" }); } });

// Products & Categories
app.get("/api/categories", async (req, res) => { const categories = await Category.find(); res.json(categories); });
app.post("/api/categories", upload.single('image'), async (req, res) => { try { let sub = []; if(req.body.subcategories) sub = JSON.parse(req.body.subcategories); const newCat = new Category({ id: Date.now(), name: req.body.name, group: req.body.group, subcategories: sub, image: req.file ? req.file.path : "" }); await newCat.save(); res.json(newCat); } catch (e) { res.status(500).json({ error: "Error" }); } });
app.put("/api/categories/:id", upload.single('image'), async (req, res) => { try { const d = { name: req.body.name, group: req.body.group }; if(req.body.subcategories) d.subcategories = JSON.parse(req.body.subcategories); if(req.file) d.image = req.file.path; await Category.updateOne({ id: req.params.id }, d); res.json({ message: "Updated" }); } catch (e) { res.status(500).json({ error: "Error" }); } });
app.delete("/api/categories/:id", async (req, res) => { try { await Category.deleteOne({ id: req.params.id }); res.json({ message: "Deleted" }); } catch (e) { res.status(500).json({ error: "Error" }); } });

app.get("/api/products", async (req, res) => { const products = await Product.find(); res.json(products); });
app.post("/api/products", upload.single('image'), async (req, res) => { try { const { name, category, subcategory, price, desc } = req.body; const newProd = new Product({ id: Date.now(), name, category, subcategory, price: parseFloat(price), desc, image: req.file ? req.file.path : "", reviews: [] }); await newProd.save(); res.json({ message: "Added", product: newProd }); } catch (e) { res.status(500).json({ error: "Error" }); } });
app.put("/api/products/:id", upload.single('image'), async (req, res) => { try { const { name, category, subcategory, price, desc } = req.body; const d = { name, category, subcategory, price: parseFloat(price), desc }; if(req.file) d.image = req.file.path; await Product.updateOne({ id: req.params.id }, d); res.json({ message: "Updated" }); } catch (e) { res.status(500).json({ error: "Error" }); } });
app.delete("/api/products/:id", async (req, res) => { try { await Product.deleteOne({ id: req.params.id }); res.json({ message: "Deleted" }); } catch (e) { res.status(500).json({ error: "Error" }); } });

// Reviews
app.get("/api/reviews", async (req, res) => { const reviews = await Review.find().sort({ createdAt: -1 }); res.json(reviews); });
app.post("/api/reviews", async (req, res) => { try { const { user, rating, comment } = req.body; const nr = new Review({ user: user||"Guest", rating: Number(rating), comment }); await nr.save(); res.json(nr); } catch (e) { res.status(500).json({ error: "Error" }); } });
app.post("/api/products/:id/reviews", async (req, res) => { try { const { user, rating, comment } = req.body; const p = await Product.findOne({ id: req.params.id }); if (!p) return res.status(404).json({ error: "Not Found" }); const nr = { id: Date.now(), user: user||"Guest", rating: Number(rating), comment: comment||"", date: new Date().toISOString() }; p.reviews.push(nr); await p.save(); res.json({ message: "Added", review: nr }); } catch (e) { res.status(500).json({ error: "Error" }); } });

app.get("/api/orders", async (req, res) => { const orders = await Order.find().sort({ createdAt: -1 }); res.json(orders); });

// ============================================
// 🟢 CREATE ORDER (STANDARD)
// ============================================
app.post("/api/create-order", async (req, res) => {
  try {
    const { customer, cart, totalAmount, isKHQR, pointsUsed, deliveryStaffId, landmark } = req.body;
    const billNumber = "INV-" + Date.now();
    const cleanAmount = Number(parseFloat(totalAmount).toFixed(2));
    let userNewPoints = 0;

    // 1. Handle Points Deduction
    if (customer.email) {
      const user = await User.findOne({ email: { $regex: new RegExp(`^${customer.email}$`, 'i') } });
      if (user && user.points >= pointsUsed) {
        user.points -= pointsUsed; 
        await user.save(); 
        userNewPoints = user.points;
      }
    }

    const qrStringInternal = `CAFEX-${Date.now()}-${cleanAmount}`;
    const qrImage = await QRCode.toDataURL(qrStringInternal);

    const orderData = {
      billNumber, amount: cleanAmount,
      customer: { ...customer, telegramUsername: customer.telegramUsername || "" },
      items: cart, 
      landmark: landmark || '', 
      deliveryStaff: deliveryStaffId || null, 
      qrCodeData: qrImage, 
      paymentStatus: 'Unpaid', 
      deliveryStatus: 'Pending'
    };

    // 🟢 KHQR FLOW (Pending Order)
    if (isKHQR && cleanAmount > 0) {
      let bakongQrString = null;
      let md5 = "md5_" + Date.now();
      const expireTime = Date.now() + 180000; // 3 mins

      if (KEYS_EXIST) {
        const khqr = new BakongKHQR();
        const isIndividual = MERCHANT_ID.includes("@");
        try {
            const info = isIndividual 
                ? new IndividualInfo(MERCHANT_ID, "CafeX", "Phnom Penh", { currency: khqrData.currency.usd, amount: cleanAmount, billNumber, mobileNumber: "85512345678", expirationTimestamp: expireTime })
                : new MerchantInfo(MERCHANT_ID, "CafeX", "Phnom Penh", "POS-001", "DEV_BANK", { currency: khqrData.currency.usd, amount: cleanAmount, billNumber, expirationTimestamp: expireTime });
            
            const response = isIndividual ? khqr.generateIndividual(info) : khqr.generateMerchant(info);
            if (response?.data) { bakongQrString = response.data.qr; md5 = response.data.md5; }
        } catch (e) {}
      }

      if (!bakongQrString) {
        bakongQrString = `https://bakong.nbc.gov.kh/pay?tid=${billNumber}&amount=${cleanAmount}&curr=USD&merchant=${MERCHANT_ID || 'bakong-demo'}`;
        md5 = "demo_md5_" + Date.now();
      }

      // Save as PENDING (No notifications yet)
      const tempOrder = new PendingOrder({ ...orderData, md5, qrString: bakongQrString });
      await tempOrder.save();

      return res.json({ qrString: bakongQrString, md5, amount: cleanAmount, expirationTimestamp: expireTime, newPoints: userNewPoints });
    }

    // 🟢 CASH / REWARD FLOW (Final Order)
    const finalOrder = new Order({ 
        ...orderData, 
        paymentMethod: cleanAmount === 0 ? 'Reward' : 'cash', 
        paymentStatus: cleanAmount === 0 ? 'Paid' : 'Unpaid' 
    });
    
    await finalOrder.save();

    // 1. Notify Driver (If assigned)
    if (deliveryStaffId) {
        await assignDriverAndNotify(deliveryStaffId, finalOrder);
    }

    // 2. Notify Telegram (NEW ORDER)
    // Uses the helper function we updated earlier
    sendTelegramNotification(finalOrder, "NEW ORDER");

    return res.json({ message: "Order Created", order: finalOrder, newPoints: userNewPoints });

  } catch (e) { 
      console.error("Create Order Error:", e); 
      res.status(500).json({ error: e.message }); 
  }
});

// ============================================
// 🟢 NEW: DRIVER GENERATE QR FOR CASH ORDERS
// ============================================
app.post("/api/driver/generate-qr", async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ error: "Order not found" });

        let bakongQrString = null;
        let md5 = "md5_" + Date.now();
        const expireTime = Date.now() + 180000; // 3 mins

        if (KEYS_EXIST) {
            const khqr = new BakongKHQR();
            const isIndividual = MERCHANT_ID.includes("@");
            try {
                const info = isIndividual 
                    ? new IndividualInfo(MERCHANT_ID, "CafeX Driver", "Phnom Penh", { currency: khqrData.currency.usd, amount: order.amount, billNumber: order.billNumber, mobileNumber: "85512345678", expirationTimestamp: expireTime })
                    : new MerchantInfo(MERCHANT_ID, "CafeX", "Phnom Penh", "POS-001", "DEV_BANK", { currency: khqrData.currency.usd, amount: order.amount, billNumber: order.billNumber, expirationTimestamp: expireTime });
                const response = isIndividual ? khqr.generateIndividual(info) : khqr.generateMerchant(info);
                if (response?.data) { bakongQrString = response.data.qr; md5 = response.data.md5; }
            } catch (e) {}
        }

        if (!bakongQrString) {
            bakongQrString = `https://bakong.nbc.gov.kh/pay?tid=${order.billNumber}&amount=${order.amount}&curr=USD&merchant=${MERCHANT_ID || 'bakong-demo'}`;
        }

        const tempOrder = new PendingOrder({
            billNumber: order.billNumber, md5, qrString: bakongQrString, amount: order.amount,
            customer: order.customer, items: order.items, deliveryStaff: order.deliveryStaff, qrCodeData: order.qrCodeData
        });
        await tempOrder.save();

        res.json({ qrString: bakongQrString, md5, expirationTimestamp: expireTime });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================
// 🟢 CHECK STATUS
// ============================================
app.post("/api/check-status", async (req, res) => {
 const { md5 } = req.body;
 const pending = await PendingOrder.findOne({ md5 });
 if (!pending) return res.json({ status: 'not_found' });

 if (KEYS_EXIST) {
    try {
      const response = await axios.post("https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5", { md5, merchantId: MERCHANT_ID }, { headers: { Authorization: `Bearer ${BAKONG_TOKEN}` } });
      
      if (response.data && response.data.responseCode === 0) {
        
        let finalOrder = await Order.findOne({ billNumber: pending.billNumber });

        if (finalOrder) {
            // Existing order (Driver Cash -> KHQR)
            finalOrder.paymentStatus = 'Paid';
            finalOrder.paymentMethod = 'khqr'; 
            await finalOrder.save();
        } else {
            // New Online Order
            finalOrder = new Order({
                billNumber: pending.billNumber, amount: pending.amount, paymentMethod: 'khqr',
                paymentStatus: 'Paid', deliveryStatus: 'Pending', customer: pending.customer, items: pending.items,
                landmark: pending.landmark, deliveryStaff: pending.deliveryStaff, qrCodeData: pending.qrCodeData
            });
            await finalOrder.save();
            
            // 🟢 Notify Driver if assigned
            if (finalOrder.deliveryStaff) await assignDriverAndNotify(finalOrder.deliveryStaff, finalOrder);
        }

        // 🟢 Notify Telegram: PAID
        sendTelegramNotification(finalOrder, "PAID");

        await PendingOrder.deleteOne({ md5 });
        io.emit("payment-success", { md5 }); 
        io.emit("order-updated", { orderId: finalOrder._id, paymentStatus: 'Paid' });

        return res.json({ status: 'success' });
      }
    } catch (e) {}
 }
 res.json({ status: 'pending' });
});

// ============================================
// 🟢 DELIVERY STAFF SYSTEM
// ============================================
app.post("/api/delivery/login", async (req, res) => { try { const { phone, password } = req.body; const staff = await DeliveryStaff.findOne({ phone }); if (!staff || staff.password !== password) return res.status(401).json({ error: "Invalid credentials" }); res.json({ message: "Login Success", staff }); } catch (e) { res.status(500).json({ error: "Error" }); } });

// 🟢 NEW: RATE DRIVER
app.post("/api/delivery/rate", async (req, res) => {
  try {
    const { staffId, stars } = req.body;
    const staff = await DeliveryStaff.findById(staffId);
    if (staff) {
        const currentTotal = staff.rating * staff.ratingCount;
        const newTotal = currentTotal + Number(stars);
        staff.ratingCount += 1;
        staff.rating = parseFloat((newTotal / staff.ratingCount).toFixed(1));
        await staff.save();
        io.emit("staff-status-changed", { id: staff._id, status: staff.status, rating: staff.rating });
        res.json({ message: "Rated Successfully", newRating: staff.rating });
    } else { res.status(404).json({ error: "Staff Not Found" }); }
  } catch (e) { res.status(500).json({ error: "Rating Error" }); }
});

app.put("/api/delivery/confirm-payment/:id", async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found" });

        // 1. Update Order Status
        order.paymentStatus = 'Paid';
        order.deliveryStatus = 'Completed';
        await order.save();

        // 2. Set Driver to Active
        if (order.deliveryStaff) {
            await DeliveryStaff.findByIdAndUpdate(order.deliveryStaff, { status: "Active" });
            io.emit("staff-status-changed", { id: order.deliveryStaff, status: "Active" });

            // 🟢 NEW: SEND TELEGRAM NOTIFICATION (PAID)
            // This uses the helper function we defined earlier
            sendTelegramNotification(order, "PAID");

            // 3. NOTIFY USER TO RATE DRIVER
            if (order.customer && order.customer.email) {
                // Find the user to add the notification to their history
                const user = await User.findOne({ email: order.customer.email });
                
                if (user) {
                    const ratingNotification = {
                        id: Date.now().toString(),
                        title: "Order Delivered! 📦",
                        message: "Your order has arrived. Please rate your delivery driver.",
                        type: "rating", // 👈 This triggers the modal logic in User App
                        isRead: false,
                        createdAt: new Date(),
                        data: { 
                            staffId: order.deliveryStaff,
                            orderId: order._id 
                        }
                    };

                    user.notifications.unshift(ratingNotification);
                    await user.save();

                    // Emit to Frontend immediately
                    io.emit("request-driver-rating", { 
                        userEmail: user.email,
                        staffId: order.deliveryStaff,
                        orderId: order._id
                    });
                    
                    // Also refresh their notification list
                    io.emit("cart-updated", { 
                        email: user.email, 
                        notifications: user.notifications 
                    });
                    
                    console.log(`⭐ Sent rating request to ${user.email}`);
                }
            }
        }

        // 4. Global Update
        io.emit("order-updated", { orderId: order._id, status: 'Completed', paymentStatus: 'Paid' });
        
        res.json({ message: "Order Completed" });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error completing order" });
    }
});
// 🟢 NEW: DRIVER PROFILE UPDATE
app.put("/api/delivery/profile/:id", upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        let staff = await DeliveryStaff.findById(id);
        if (!staff) return res.status(404).json({ error: "Staff not found" });
        if (req.file) staff.image = req.file.path;
        if (req.body.name) staff.name = req.body.name;
        if (req.body.password) staff.password = req.body.password;
        await staff.save();
        res.json({ message: "Profile Updated", staff });
    } catch (e) { res.status(500).json({ error: "Update Failed" }); }
});

// ADMIN STAFF CRUD
app.post("/api/admin/staff", upload.single('image'), async (req, res) => { try { const { name, phone, email, telegramUsername, vehicleType, password } = req.body; const staff = new DeliveryStaff({ name, phone, email, telegramUsername: telegramUsername ? telegramUsername.replace('@', '') : '', vehicleType, password: password || "123456", image: req.file ? req.file.path : "https://cdn-icons-png.flaticon.com/512/1995/1995515.png", status: "Active" }); await staff.save(); res.json(staff); } catch (e) { res.status(500).json({ error: "Failed" }); } });
app.get("/api/admin/staff", async (req, res) => { const staff = await DeliveryStaff.find(); res.json(staff); });
app.put("/api/admin/staff/:id", upload.single('image'), async (req, res) => { try { const { name, phone, email, telegramUsername, vehicleType, status, password } = req.body; const updateData = { name, phone, email, telegramUsername: telegramUsername ? telegramUsername.replace('@', '') : '', vehicleType, status }; if (password && password.trim() !== "") updateData.password = password; if(req.file) updateData.image = req.file.path; const staff = await DeliveryStaff.findByIdAndUpdate(req.params.id, updateData, { new: true }); if (!staff) return res.status(404).json({ error: "Not found" }); res.json(staff); } catch (e) { res.status(500).json({ error: "Error" }); } });
app.delete("/api/admin/staff/:id", async (req, res) => { try { const staff = await DeliveryStaff.findByIdAndDelete(req.params.id); if (!staff) return res.status(404).json({ error: "Not found" }); res.json({ message: "Deleted" }); } catch (e) { res.status(500).json({ error: "Error" }); } });

// OTHER API ROUTES
app.put("/api/user/profile/:id", upload.single('image'), async (req, res) => { try { const { name, email, phone } = req.body; let user = await User.findById(req.params.id); if (!user) return res.status(404).json({ error: "Not Found" }); if(name) user.name = name; if(email) user.email = email; if(phone) user.phone = phone; if(req.file) user.image = req.file.path; await user.save(); const u = user.toObject(); delete u.password; res.json({ message: "Updated", user: u }); } catch (e) { res.status(500).json({ error: "Error" }); } });
app.post("/api/categories", upload.single('image'), async (req, res) => { try { let sub = []; if(req.body.subcategories) sub = JSON.parse(req.body.subcategories); const newCat = new Category({ id: Date.now(), name: req.body.name, group: req.body.group, subcategories: sub, image: req.file ? req.file.path : "" }); await newCat.save(); res.json(newCat); } catch (e) { res.status(500).json({ error: "Error" }); } });
app.put("/api/categories/:id", upload.single('image'), async (req, res) => { try { const d = { name: req.body.name, group: req.body.group }; if(req.body.subcategories) d.subcategories = JSON.parse(req.body.subcategories); if(req.file) d.image = req.file.path; await Category.updateOne({ id: req.params.id }, d); res.json({ message: "Updated" }); } catch (e) { res.status(500).json({ error: "Error" }); } });
app.post("/api/products", upload.single('image'), async (req, res) => { try { const { name, category, subcategory, price, desc } = req.body; const newProd = new Product({ id: Date.now(), name, category, subcategory, price: parseFloat(price), desc, image: req.file ? req.file.path : "", reviews: [] }); await newProd.save(); res.json({ message: "Added", product: newProd }); } catch (e) { res.status(500).json({ error: "Error" }); } });
app.put("/api/products/:id", upload.single('image'), async (req, res) => { try { const { name, category, subcategory, price, desc } = req.body; const d = { name, category, subcategory, price: parseFloat(price), desc }; if(req.file) d.image = req.file.path; await Product.updateOne({ id: req.params.id }, d); res.json({ message: "Updated" }); } catch (e) { res.status(500).json({ error: "Error" }); } });
app.get("/api/users", async (req, res) => { try { const users = await User.find({}, "-password"); res.json(users); } catch (e) { res.status(500).json({ error: "Error" }); } });
app.get("/api/categories", async (req, res) => { const categories = await Category.find(); res.json(categories); });
app.delete("/api/categories/:id", async (req, res) => { try { await Category.deleteOne({ id: req.params.id }); res.json({ message: "Deleted" }); } catch (e) { res.status(500).json({ error: "Error" }); } });
app.get("/api/products", async (req, res) => { const products = await Product.find(); res.json(products); });
app.delete("/api/products/:id", async (req, res) => { try { await Product.deleteOne({ id: req.params.id }); res.json({ message: "Deleted" }); } catch (e) { res.status(500).json({ error: "Error" }); } });
app.get("/api/reviews", async (req, res) => { const reviews = await Review.find().sort({ createdAt: -1 }); res.json(reviews); });
app.post("/api/reviews", async (req, res) => { try { const { user, rating, comment } = req.body; const nr = new Review({ user: user||"Guest", rating: Number(rating), comment }); await nr.save(); res.json(nr); } catch (e) { res.status(500).json({ error: "Error" }); } });
app.post("/api/products/:id/reviews", async (req, res) => { try { const { user, rating, comment } = req.body; const p = await Product.findOne({ id: req.params.id }); if (!p) return res.status(404).json({ error: "Not Found" }); const nr = { id: Date.now(), user: user||"Guest", rating: Number(rating), comment: comment||"", date: new Date().toISOString() }; p.reviews.push(nr); await p.save(); res.json({ message: "Added", review: nr }); } catch (e) { res.status(500).json({ error: "Error" }); } });
app.get("/api/orders", async (req, res) => { const orders = await Order.find().sort({ createdAt: -1 }); res.json(orders); });
app.put("/api/user/cart", async (req, res) => { try { await User.findByIdAndUpdate(req.body.userId, { savedCart: req.body.cart }); res.json({ message: "Synced" }); } catch(e){ res.status(500).json({error:"Error"}); } });
app.put("/api/orders/:id/status", async (req, res) => { try { const { deliveryStatus, paymentStatus } = req.body; await Order.findByIdAndUpdate(req.params.id, { deliveryStatus, paymentStatus }); io.emit("order-updated", { orderId: req.params.id, status: deliveryStatus, paymentStatus }); res.json({ message: "Updated" }); } catch(e){ res.status(500).json({error:"Error"}); } });
app.post("/api/admin/remove-cart-item", async (req, res) => { try { const { userId, cartId } = req.body; const user = await User.findById(userId); if(!user) return; user.savedCart = user.savedCart.filter(i=>i.cartId!==cartId); user.notifications.unshift({title:"Removed",message:"Item out of stock",type:'alert'}); await user.save(); io.emit("cart-updated", { userId: user._id.toString(), email: user.email, notifications: user.notifications }); res.json({message:"Removed"}); } catch(e){ res.status(500).json({error:"Error"}); } });
app.put("/api/user/notifications/read", async (req, res) => { try { await User.updateOne({ _id: req.body.userId, "notifications.id": req.body.notificationId }, { $set: { "notifications.$.isRead": true } }); res.json({ success: true }); } catch(e){ res.status(500).json({error:"Error"}); } });
app.delete("/api/orders/:id", async (req, res) => { try { await Order.findByIdAndDelete(req.params.id); res.json({ message: "Deleted" }); } catch (e) { res.status(500).json({ error: "Error" }); } });

// 🟢 CRITICAL UPDATE: Toggle Active & Cleanup Carts
app.put("/api/products/:id/toggle-active", async (req, res) => {
    try {
        const { isActive } = req.body;
        const paramId = req.params.id; // String from URL

        // 1. Update Product
        let product = await Product.findOneAndUpdate({ id: paramId }, { isActive }, { new: true });
        if (!product) {
            if (mongoose.Types.ObjectId.isValid(paramId)) {
                product = await Product.findByIdAndUpdate(paramId, { isActive }, { new: true });
            }
        }

        if (!product) return res.status(404).json({ error: "Product not found" });

        io.emit("product-status-changed", { productId: product.id, isActive });

        // 2. IF DEACTIVATING: Remove from ALL user carts
        if (!isActive) {
            console.log(`⚠️ Deactivating "${product.name}". Scanning user carts...`);

            const usersWithItem = await User.find({
                $or: [
                    { "savedCart.id": Number(product.id) },
                    { "savedCart.id": String(product.id) },
                    { "savedCart.product": product._id }
                ]
            });

            console.log(`🔍 Found ${usersWithItem.length} users with this item.`);

            for (const user of usersWithItem) {
                const initialLength = user.savedCart.length;

                user.savedCart = user.savedCart.filter(item => {
                    const isCustomIdMatch = String(item.id) === String(product.id);
                    const isMongoIdMatch = item.product && String(item.product) === String(product._id);
                    return !(isCustomIdMatch || isMongoIdMatch);
                });

                if (user.savedCart.length < initialLength) {
                    const newNotification = {
                        id: Date.now().toString(),
                        title: "Item Unavailable",
                        message: `"${product.name}" is no longer available and was removed from your cart.`,
                        type: "alert",
                        isRead: false,
                        createdAt: new Date(),
                        data: { productId: product.id }
                    };

                    user.notifications.unshift(newNotification);
                    await user.save(); 

                    io.emit("cart-updated", { 
                        email: user.email, 
                        cart: user.savedCart, 
                        notifications: user.notifications 
                    });

                    console.log(`✅ Removed from ${user.email}'s cart.`);
                }
            }
        }

        res.json({ message: "Updated", product });
    } catch (e) {
        console.error("Toggle Error:", e);
        res.status(500).json({ error: "Error updating product" });
    }
});

io.on("connection", (socket) => {
console.log("🔗 Client:", socket.id);
socket.on("staff-location-update", (data) => { io.emit("driver-moved", data); });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));