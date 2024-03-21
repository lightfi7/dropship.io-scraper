const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const cron = require("node-cron");
const fernet = require("fernet");
const secret = new fernet.Secret("uV7HJdHDlqqJN6Fuyl8ulILoGSeccbyCpr6h3wBerpw");

const config = {
  email: "maxbudge6472@gmail.com",
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

var storeSchema = mongoose.Schema({
  shopify_shop_id: Number,
  internal_shop_id: Number,
  custom_domain: String,
  original_domain: String,
  best_ranked_domain: String,
  all_domains: [String],
  custom_domain_search: String,
  title: { type: String, sparse: true },
  favicon: String,
  logo: String,
  currency: String,
  languages: String,
  created_at: { type: String, index: true },
  products_count: Number,
  tracked_by: String,
  best_selling_products: {},
  random_sort: String,
  week_sales: Number,
  week_revenue: Number,
  month_sales: Number,
  month_revenue: Number,
  quarter_sales: Number,
  quarter_revenue: Number,
  aggregations: {},
  facebook_add_library: String,
  is_tracked: Boolean,
  is_locked: Boolean,
});

const Store = mongoose.model("topstores", storeSchema);

var productSchema = mongoose.Schema({
  store: {},
  title: String,
  handle: String,
  images: Number,
  variants: Number,
  main_image: String,
  original_price: String,
  usd_price: Number,
  created_at: { type: String, index: true },
});

const StoreProduct = mongoose.model("storeproducts", productSchema);

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
      status.topstore.updatedAt = Date.now();
      status.topstore.running = false;
      await status.save();
    } else {
      status.topstore.updatedAt = Date.now();
      status.topstore.running = true;
      await status.save();
    }
  } catch (err) {
    console.log(err);
  }
};

const main = async () => {
  const browser = await puppeteer.launch({
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
    page_size: 50,
    timestamp: Math.floor(new Date().getTime() / 36e5),
    new_search: true,
    filters: {
      period: "month",
      languages: null,
      domain: null,
      sales: { min: 10, max: null },
      revenue: { min: 10000, max: null },
      created_at: { min: null, max: null },
      products: { min: 1, max: null },
    },
  };

  t.setMonth(t.getMonth() - 1);
  t.setDate(0);
  t.setHours(0, 0, 0, 0);

  const keys = await Store.find({
    created_at: { $gte: t },
  }).distinct("shopify_shop_id");

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
              `https://api.dropship.io/api/sales_tracker/top_stores/`
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
      const data = r.results.filter((item) => !keys.includes(item.id));

      await Store.insertMany(data);

      for (let i in data) {
        const d = data[i];
        try {
          const params = {
            popup: true,
            page: 1,
            page_size: 100,
            ordering: "-created_at",
            date_range: {},
          };
          const response = await page.evaluate(
            (data) => {
              return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open(
                  "POST",
                  `https://api.dropship.io/api/sales_tracker/products/store/${data.internal_shop_id}/`
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
              internal_shop_id: d.internal_shop_id,
              encrypted: token.encode(JSON.stringify(params)),
            }
          );
          await StoreProduct.insertMany(response.results);
        } catch (err) {}
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, 3000);
        });
      }

      console.log(p);
    } catch (err) {
      console.log(err);
    }
    if (p * 50 >= r.total - 1 || p * 50 > 10000) break;
  }

  await browser.close();
};

cron.schedule("0 8 * * *", async () => {
  await submitStatus(false);
  try {
    await main();
  } catch (err) {}
  await submitStatus(true);
});
