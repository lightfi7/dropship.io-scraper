const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const cron = require("node-cron");
const fernet = require("fernet");
const secret = new fernet.Secret("uV7HJdHDlqqJN6Fuyl8ulILoGSeccbyCpr6h3wBerpw");

const config = {
  email: "chaskaspay@gmail.com",
  password: "Sertu$12",
};

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

mongoose
  .connect("mongodb://34.16.54.203:27017", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "mydatabase",
    user: "root",
    pass: "mari2Ana23sem",
  })
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch((err) => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

var productSchema = mongoose.Schema({
  id: Number,
  handle: String,
  title: { type: String, sparse: true },
  created_at: { type: Date, index: true },
  images: Number,
  is_tracked: Boolean,
  main_image: String,
  variants: Number,
  monthly_revenue: Number,
  monthly_sales: Number,
  original_price: Number,
  original_price_max: Number,
  original_price_min: Number,
  usd_price: Number,
  product_type: String,
  category: String,
  quick_search: [],
  store: {
    id: Number,
    internal_shop_id: Number,
    original_domain: String,
    best_ranked_domain: String,
    created_at: String,
    currency: String,
    custom_domain: String,
    favicon: String,
    is_tracked: Boolean,
    products_count: Number,
    shopify_shop_id: Number,
  },
  usd_price_min: Number,
  usd_price_max: Number,
});

var chartSchema = mongoose.Schema({
  pid: { type: mongoose.Schema.Types.ObjectID, ref: "products" },
  chart: [],
  last_updated: Date,
});

const Product = mongoose.model("products", productSchema);
const Chart = mongoose.model("charts", chartSchema);
var schemaStatus = mongoose.Schema(
  {
    ads: {
      updatedAt: { type: Date, default: Date.now() },
      running: { type: Boolean, default: false },
    },
    topproduct: {
      updatedAt: { type: Date, default: Date.now() },
      running: { type: Boolean, default: false },
    },
    topstore: {
      updatedAt: { type: Date, default: Date.now() },
      running: { type: Boolean, default: false },
    },
    product: {
      updatedAt: { type: Date, default: Date.now() },
      running: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

const Status = mongoose.model("status", schemaStatus);
const findOneOrCreate = () =>
  new Promise((resolve, reject) => {
    Status.findOne({})
      .then((doc) => {
        if (doc) resolve(doc);
        else
          Status.create({
            ads: {
              updatedAt: Date.now(),
              running: false,
            },
            topproduct: {
              updatedAt: Date.now(),
              running: false,
            },
            topstore: {
              updatedAt: Date.now(),
              running: false,
            },
            product: {
              updatedAt: Date.now(),
              running: false,
            },
          }).then((doc) => resolve(doc));
      })
      .catch((err) => reject(err));
  });

const submitStatus = async (finish) => {
  try {
    const status = await findOneOrCreate();
    if (finish) {
      status.product.updatedAt = Date.now();
      status.product.running = false;
      await status.save();
    } else {
      status.product.updatedAt = Date.now();
      status.product.running = true;
      await status.save();
    }
  } catch (err) {
    console.log(err);
  }
};

const main = async () => {
  const browser = await puppeteer.launch({
    // headless: false,
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();

  await page.setRequestInterception(true);

  let authorization = "";

  page.on("request", async (interceptedRequest) => {
    if (
      interceptedRequest
        .url()
        .includes("https://api.dropship.io/api/product_database/search/")
    ) {
      if (!authorization)
        authorization = interceptedRequest.headers().authorization;
      interceptedRequest.continue();
    } else {
      interceptedRequest.continue();
    }
  });

  await page.goto("https://app.dropship.io/login", {
    timeout: 300000,
  });

  await page.waitForSelector("#email", { timeout: 300000 });

  await page.type("#email", config.email);

  await page.type("#password", config.password);

  await page.click("button[type=submit]");

  await page.waitForNavigation({ timeout: 300000 });

  await page.goto("https://app.dropship.io/product-database", {
    timeout: 300000,
  });

  await page.screenshot({ path: "screenshot.png" });

  let p = 0;
  const t = new Date();

  const params = {
    page: 1,
    page_size: 250,
    ordering: [null],
    new_search: true,
    filters: {
      categories: [
        0, 11, 1, 12, 2, 13, 3, 14, 4, 15, 5, 16, 7, 17, 6, 18, 8, 19, 9, 20,
        10,
      ],
      exclude_top_brands: false,
      exclude_unavailable: true,
      only_dropshipping: false,
      only_print: false,
      title: { exclude: null, include: null },
      description: { exclude: null, include: null },
      domain: { exclude: null, include: null },
      price: { max: null, min: null },
      sales: { max: null, min: null },
      revenue: { max: null, min: 500 },
      products: { max: null, min: null },
      images: { max: null, min: null },
      variants: { max: null, min: null },
      product_created_at: {
        min: `${t.getFullYear()}-${t.getMonth().toString().padStart(2, "0")}-${(
          t.getDate() + 1
        )
          .toString()
          .padStart(2, "0")}`,
        max: `${t.getFullYear()}-${(t.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${t.getDate().toString().padStart(2, "0")}`,
      },
      store_created_at: { min: null, max: null },
      language: null,
      currency: null,
      domain_tld: null,
    },
  };

  t.setMonth(t.getMonth() - 1);
  t.setDate(0);
  t.setHours(0, 0, 0, 0);

  const keys = await Product.find({
    created_at: { $gte: t },
  }).distinct("id");

  for (p = 1; ; p++) {
    params.page = p;
    var token = new fernet.Token({
      secret: secret,
      time: Date.parse(new Date()),
    });

    try {
      const r = await page.evaluate(
        (data) => {
          return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(
              "POST",
              `https://api.dropship.io/api/product_database/search/`
            );
            xhr.setRequestHeader("authorization", data.authorization);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onload = () => {
              if (xhr.status === 200 && xhr.status < 400) {
                resolve(JSON.parse(xhr.responseText));
              } else {
                reject(xhr.statusText);
              }
            };
            xhr.onerror = () => reject(xhr.statusText);
            xhr.send(JSON.stringify({ encrypted: data.encrypted }));
          });
        },
        {
          authorization,
          encrypted: token.encode(JSON.stringify(params)),
        }
      );

      let results = r.results.filter((ii) => !keys.includes(ii.id));
      results = await Product.insertMany(results);

      let charts = [];
      for (let i = 0; i < results.length; i++) {
        try {
          let c = await page.evaluate(
            (d) =>
              new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open(
                  "GET",
                  `https://api.dropship.io/api/product_database/products/chart/${d.sid}/${d.pid}/`
                );
                xhr.setRequestHeader("authorization", d.authorization);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.onload = () => {
                  if (xhr.status === 200 && xhr.status < 400) {
                    resolve(JSON.parse(xhr.responseText));
                  } else {
                    reject(xhr.statusText);
                  }
                };
                xhr.onerror = () => reject(xhr.statusText);
                xhr.send();
              }),
            {
              authorization,
              pid: results[i]?.id,
              sid: results[i]?.store.id,
            }
          );
          charts.push({
            pid: results[i]._id,
            chart: c.chart,
            last_updated: c.last_updated,
          });
        } catch (err) {
          console.log(err);
          continue;
        }
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, 3000);
        });
      }

      await Chart.insertMany(charts);
      if (p * 250 >= r.total - 1 || p * 250 > 10000) {
        break;
      }
      console.log(p);
    } catch (err) {
      console.log(err);
      break;
    }

    await page.reload();
  
  }
  await browser.close();
};

cron.schedule("0 0 * * *", async () => {
  await submitStatus(false);
  try {
    await main();
  } catch (err) {}
  await submitStatus(true);
});
main();
