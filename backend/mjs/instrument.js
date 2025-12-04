const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://cd14845b79b9f9271a1fd097758228b7@o4510473220718592.ingest.de.sentry.io/4510476115247184",
  sendDefaultPii: true,
});