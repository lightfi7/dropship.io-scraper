const fernet = require("fernet");
const secret = new fernet.Secret("uV7HJdHDlqqJN6Fuyl8ulILoGSeccbyCpr6h3wBerpw");
var token = new fernet.Token({
  secret: secret,
  token:
    "gAAAAABl51BoBbN7o02Pzl-hpY0T0yoEJroMEA_Sk3cuFBxUvx7IBzC1tTliG3fYcnKJtePdLGRU46oP-lRbexcS-WxGLowI7kwLKCiIurPsAyt4OrNwJQUTNSquLhvn0YjfivrAp1jhMtFkNle2ZhaKtTipq597ZqP_ahrMnc1Ut6CLQOjUfrs=",
  ttl: 0,
});
console.log(token.decode());

const t = Math.floor(new Date().getTime() / 36e5);
console.log(t);

// TOP STORES

// const params = {
//   page: 1,
//   page_size: 50,
//   timestamp: 474643,
//   new_search: true,
//   filters: {
//     period: "month",
//     languages: null,
//     domain: null,
//     sales: { min: 10, max: null },
//     revenue: { min: 10000, max: null },
//     created_at: { min: null, max: null },
//     products: { min: 1, max: null },
//   },
// };

// const params = {
//   page: 2,
//   page_size: 50,
//   timestamp: 474643,
//   new_search: false,
//   filters: {
//     period: "month",
//     languages: null,
//     domain: null,
//     sales: { min: 10, max: null },
//     revenue: { min: 5000, max: null },
//     created_at: { min: null, max: null },
//     price: { min: 10, max: null },
//   },
// };
