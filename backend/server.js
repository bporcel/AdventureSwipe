const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("./mjs/instrument.js");
const express = require("express");
const gameRoutes = require("./routes/gameRoutes");
const Sentry = require("@sentry/node");
const logger = require("./utils/logger");

const app = express();

// Security Middleware
app.use(helmet());

// Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: "Too many requests, please try again later." }
});
app.use(apiLimiter);

app.use(cors()); // Allow all origins for now, but Helmet adds security headers

app.use(express.json({ limit: '50mb' }));

// Routes
app.use("/", gameRoutes);

app.get("/", (req, res) => {
    res.send("AdventureSwipe backend is healthy.");
});

Sentry.setupExpressErrorHandler(app);
app.use(function onError(err, req, res, next) {
    res.statusCode = 500;
    res.end(res.sentry + "\n");
});

app.listen(process.env.PORT || 5000, () =>
    logger.info(`✅ ${process.env.NODE_ENV} environment => Backend running on port ${process.env.PORT || 5000}`)
);
